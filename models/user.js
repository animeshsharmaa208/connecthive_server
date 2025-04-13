const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
  },

  linkedinProfile: {
    type: String,
  },
  bio: {
    type: String,
  },
  website: {
    type: String,
  },
  verified: {
    type: Boolean,
    default: false,
    required: true,
  },
  category: {
    type: String,
    enum: ["student", "founder", "investor", "professional"],
    required: true,
    default: "professional",
  },

  approved: {
    type: String,
    enum: ["submitted", "approved", "unsubmitted", "rejected"],
    required: true,
    default: "unsubmitted",
  },

  registeredBy: {
    type: String,
    enum: ["google", "linkedin", "email"],
    required: true,
    default: "email",
  },

  approvedBy: {
    type: ObjectId,
    ref: "User",
  },

  challengesInWorkingProfessional: {
    type: "String",
  },
  workSector: {
    type: "String",
  },
  lackingWorkPlaceMakeCounterProductive: {
    type: "String",
  },
  practicalLearningCoursesEnhanceWorkQuality: {
    type: "String",
  },
  isCurrentProfessionalNetworkLimited: {
    type: "String",
  },
  expectFromOnlineLearningAndCommunityPlateform: {
    type: "String",
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    required: true,
    default: "user",
  },
  mobile: {
    type: String,
  },
  blocked: [{ type: ObjectId, ref: "User" }],
  blockedBy: [{ type: ObjectId, ref: "User" }],
  password: {
    type: String,
    required: function () {
      return this.registeredBy === "email";
    },
  },
  resetToken: String,
  expireToken: Date,
  pic: {
    type: String,
    default:
      "https://cdn.pixabay.com/photo/2016/03/12/23/18/man-1253004_1280.jpg",
  },
  friends: [{ type: ObjectId, ref: "User" }],
  following: [{ type: ObjectId, ref: "User" }],
});

(userSchema.methods = {
  authenticate: async function (password) {
    return await bcrypt.compare(password, this.password);
  },
}),
  (module.exports = mongoose.model("User", userSchema));
