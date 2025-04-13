const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const reportSchema = mongoose.Schema(
  {
    reason:{
        type: String,
        required: true
    },
    reportedBy: { type: ObjectId, ref: "User", required: true },
    postId: { type: ObjectId, ref: "Post", required: true },
    status: {
        type: String,
        enum: ["reported", "ignored"],
        required: true,
        default: "reported",
      }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Report", reportSchema);
