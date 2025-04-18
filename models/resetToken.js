const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema.Types
const bcrypt = require("bcrypt");

const resetTokenSchema = new mongoose.Schema({
   owner: {
    type: ObjectId,
    ref: "User",
    required: true,

   },
   token: {
     type: String,
     required: true
   },
   createdAt: {
    type: Date,
    expires: 3600,
    default: Date.now(),
   }

});

resetTokenSchema.pre("save" ,async function (next) {
      if(this.isModified("token")){
        const hash = await bcrypt.hash(this.token, 8)
        this.token = hash;
      }
      next();
    },
),

resetTokenSchema.methods.compareToken = async function (token) {
 const result = bcrypt.compareSync(token, this.token)
 return result;
}

module.exports = mongoose.model("ResetToken",resetTokenSchema)