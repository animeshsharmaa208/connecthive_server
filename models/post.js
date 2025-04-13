const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const postSchema = new mongoose.Schema(
  {
    content: {
      type: String,
    },
    images: {
      type: Array,
    },
    docs: {
      type: Array,
    },
    video: {
      type: Array,
    },
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    created: {
      type: Date,
      default: Date.now,
      required: true,
    },
    updated: Date,
    likes: [{ type: ObjectId, ref: "User" }],
    comments: [{ type: ObjectId, ref: "Comment" }],
    reports: [{ type: ObjectId, ref: "Report" }],
    reposts: [{ type: ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Post", postSchema);
