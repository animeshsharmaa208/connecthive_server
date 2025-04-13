const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const commentSchema = mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    tag: Object,
    reply: ObjectId,
    likes: [{ type: ObjectId, ref: "User" }],
    user: { type: ObjectId, ref: "User", required: true },
    postId: ObjectId,
    postUserId: ObjectId,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Comment", commentSchema);
