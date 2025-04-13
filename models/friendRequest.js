const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const friendRequestSchema = mongoose.Schema(
  {
    requestedBy: { type: ObjectId, ref: "User", required: true },
    recipient: { type: ObjectId, ref: "User", required: true },
    status: {
      type: Boolean,
      default: false,
      required: true,
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FriendRequest", friendRequestSchema);
