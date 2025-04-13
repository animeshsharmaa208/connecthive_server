const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const pushNotifyTokenSchema = mongoose.Schema(
  {
    token: [{
      type: String,
      required: true,
      unique: true
    }],
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PushNotifyToken", pushNotifyTokenSchema);
