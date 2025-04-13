const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const repostSchema = mongoose.Schema(
  {
    repostedBy: { type: ObjectId, ref: "User", required: true },
    postId: { type: ObjectId, ref: "Post", required: true },
    quotes: {
      type: String
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Repost", repostSchema);
