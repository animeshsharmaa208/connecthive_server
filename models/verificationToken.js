const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema.Types
const bcrypt = require("bcrypt");

const verificationTokenSchema = new mongoose.Schema({
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

verificationTokenSchema.pre("save" ,async function (next) {
      if(this.isModified("token")){
        const hash = await bcrypt.hash(this.token, 8)
        this.token = hash;
      }
      next();
    },
),

verificationTokenSchema.methods.compareToken = async function (token) {
 const result = bcrypt.compareSync(token, this.token)
 return result;
}

module.exports = mongoose.model("VerificationToken",verificationTokenSchema)