const FriendRequest = require("../models/friendRequest");
const Users = require("../models/user");
const cloudinary = require("cloudinary").v2;
const Messages = require("../models/message");
const Conversations = require("../models/conversation");
const { default: mongoose } = require("mongoose");

cloudinary.config({
  secure: true,
});

exports.userCtrl = {
  searchUser: async (req, res) => {
    try {
      const users = await Users.find({
        name: { $regex: req.query.name, $nin: req.user.name },
      })
        .limit(10)
        .select("name email pic");

      console.log(users);
      if (!users.length) {
        return res.status(401).json({ error: "No users found" });
      } else {
        res.json({ users });
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  searchFriends: async (req, res) => {
    try {
      const user = await Users.findOne({ _id: req.user._id })
        .select("-password")
        .populate("friends following", "-password");
      if (!user) return res.status(400).json({ msg: "Invalid user" });

      const result = user.friends.filter((friend) =>
        friend.name.toLowerCase().includes(req.query.name)
      );

      res.json({ users: result });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  getUser: async (req, res) => {
    try {
      const user = await Users.findOne({ _id: req.params.id })
        .select("-password")
        .populate("friends following blocked", "-password");
      if (!user) return res.status(400).json({ error: "No user Exists" });
      const followRequest = await FriendRequest.findOne({
        requestedBy: req.user._id,
        recipient: req.params.id,
      });
      console.log(followRequest);
      res.json({ user, followRequest });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { name, email, mobile, linkedInProfile, bio, website, pic } =
        req.body;
      // console.log(req.body);
      if (!name) return res.status(500).json({ error: "Fullname is requires" });

      const userDataOld = await Users.findById(req.user._id);

      if (userDataOld) {
        const des = await cloudinary.uploader.destroy(
          userDataOld.pic.split("/")[7].split(".")[0]
        );
      }

      const user = await Users.findOneAndUpdate(
        { _id: req.user._id },
        {
          name,
          email,
          linkedinProfile: linkedInProfile,
          bio,
          website,
          pic,
          mobile,
        }
      );
      // console.log(user);
      res.json({ message: "update success", user });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  updateQuestions: async (req, res) => {
    try {
      const {
        approved: approved,
        category,
        challengesInWorkingProfessional,
        workSector,
        lackingWorkPlaceMakeCounterProductive,
        practicalLearningCoursesEnhanceWorkQuality,
        isCurrentProfessionalNetworkLimited,
        expectFromOnlineLearningAndCommunityPlateform,
      } = req.body;

      if (
        !challengesInWorkingProfessional ||
        !category ||
        !workSector ||
        !lackingWorkPlaceMakeCounterProductive ||
        !practicalLearningCoursesEnhanceWorkQuality ||
        !isCurrentProfessionalNetworkLimited ||
        !expectFromOnlineLearningAndCommunityPlateform
      )
        return res.status(500).json({ error: "All questions are mandatory" });

      const user = await Users.findOneAndUpdate(
        { _id: req.user._id },
        {
          approved,
          category,
          challengesInWorkingProfessional,
          workSector,
          lackingWorkPlaceMakeCounterProductive,
          practicalLearningCoursesEnhanceWorkQuality,
          isCurrentProfessionalNetworkLimited,
          expectFromOnlineLearningAndCommunityPlateform,
        },
        { returnDocument: "after" }
      );
      res.json({ message: "update success", user });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  sendFriendRequest: async (req, res) => {
    try {
      const friendRequest = await FriendRequest.find({
        requestedBy: req.user._id,
        recipient: req.params.recipientId,
      });
      if (friendRequest.length > 0)
        return res
          .status(400)
          .json({ error: "you have already send support request" });

      const newFriendRequest = new FriendRequest({
        requestedBy: req.user._id,
        recipient: req.params.recipientId,
      });

      const result = await newFriendRequest.save();

      res.json({
        result,
        message: "follow request sent successfully",
        success: true,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  unsendFriendRequest: async (req, res) => {
    try {
      const result = await FriendRequest.findOneAndDelete({
        requestedBy: req.user._id,
        recipient: req.params.recipientId,
      });
      if (!result)
        return res.status(400).json({ error: "unable to unfollow the user" });

      res.json({
        result,
        message: "unfollowed request successfully",
        success: true,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getAllFriendRequest: async (req, res) => {
    try {
      const friendRequest = await FriendRequest.find({
        recipient: req.params.id,
      }).populate("requestedBy", "-password");
      if (!friendRequest)
        return res.status(200).json({ message: "No support request exist" });

      res.status(200).json({
        friendRequest,
        message: "support requests found",
        success: true,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  friend: async (req, res) => {
    try {
      const user = await Users.find({
        _id: req.params.id,
        friends: req.user._id,
      });
      if (user.length > 0)
        return res.status(400).json({ error: "you are  already friends" });

      const newUser = await Users.findOneAndUpdate(
        { _id: req.params.id },
        {
          $push: { friends: req.user._id },
        },
        { new: true }
      ).populate("friends following", "-password");

      await Users.findOneAndUpdate(
        { _id: req.user._id },
        {
          $push: { friends: req.params.id },
        },
        { new: true }
      );

      await FriendRequest.findOneAndRemove({ requestedBy: req.params.id });

      res.json({ newUser, message: "supporter added succesfully" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  unfriend: async (req, res) => {
    try {
      const newUser = await Users.findOneAndUpdate(
        { _id: req.params.id },
        {
          $pull: { friends: req.user._id },
        },
        { new: true }
      ).populate("friends", "-password");

      await Users.findOneAndUpdate(
        { _id: req.user._id },
        {
          $pull: { friends: req.params.id },
        },
        { new: true }
      );

      await Messages.findOneAndDelete({
        _id: req.params.id,
        sender: req.user._id,
      });

      const newConver = await Conversations.findOneAndDelete({
        $or: [
          { recipients: [req.user._id, req.params.id] },
          { recipients: [req.params.id, req.user._id] },
        ],
      });
      await Messages.deleteMany({ conversation: newConver._id });

      res.json({ newUser, message: "unfriend successfully" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  getOnlyUser: async (req, res) => {
    try {
      const user = await Users.findOne({ _id: req.user.id })
        .select("-password")
        .populate("friends following", "-password");
      if (!user) return res.status(400).json({ error: "No user Exists" });

      res.json({ user });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  blockUser: async (req, res) => {
    try {
      const user = await Users.find({
        _id: req.user._id,
        blocked: req.params.id,
      });
      if (user.length > 0)
        return res.status(400).json({ error: "you have already blocked this" });

      const newUser = await Users.findOneAndUpdate(
        { _id: req.user._id },
        {
          $push: { blocked: req.params.id },
          $pull: { friends: req.params.id },
        },
        { new: true }
      ).populate("friends following blocked", "-password");

      await Users.findOneAndUpdate(
        { _id: req.params.id },
        {
          $push: { blockedBy: req.user._id },
          $pull: { friends: req.user.id },
        },
        { new: true }
      );

      await Messages.findOneAndDelete({
        _id: req.params.id,
        sender: req.user._id,
      });

      const newConver = await Conversations.findOneAndDelete({
        $or: [
          { recipients: [req.user._id, req.params.id] },
          { recipients: [req.params.id, req.user._id] },
        ],
      });
      await Messages.deleteMany({ conversation: newConver._id });

      res.json({ newUser, message: "user blocked success succesfully" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  unblockUser: async (req, res) => {
    try {
      const newUser = await Users.findOneAndUpdate(
        { _id: req.user._id },
        {
          $pull: { blocked: req.params.id },
        },
        { new: true }
      ).populate("friends following blocked", "-password");

      await Users.findOneAndUpdate(
        { _id: req.params.id },
        {
          $pull: { blockedBy: req.user._id },
        },
        { new: true }
      );

      res.json({ newUser, message: "user unblocked succesfully" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  suggestUser: async (req, res) => {
    try {
      const suggestions = await Users.aggregate([
        {
          $match: { _id: mongoose.Types.ObjectId(req.user._id) },
        },
        {
          $lookup: {
            from: "users",
            localField: "friends",
            foreignField: "friends",
            as: "suggestions",
          },
        },
        {
          $unwind: "$suggestions",
        },
        {
          $match: {
            "suggestions._id": { $ne: mongoose.Types.ObjectId(req.user._id) },
          },
        },
        {
          $lookup: {
            from: "friendrequests",
            let: { suggestionId: "$suggestions._id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$recipient", "$$suggestionId"] },
                      {
                        $eq: [
                          "$requestedBy",
                          mongoose.Types.ObjectId(req.user._id),
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: "friendrequest",
          },
        },
        {
          $match: {
            friendrequest: { $size: 0 },
          },
        },
        {
          $group: {
            _id: "$suggestions._id",
            name: { $first: "$suggestions.name" },
            pic: { $first: "$suggestions.pic" },
            bio: { $first: "$suggestions.bio" },
            mutualFriendCount: { $sum: 1 },
          },
        },
        {
          $sort: { mutualFriendCount: -1 },
        },
        {
          $limit: 5,
        },
      ]);

      res.json(suggestions);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  getLatestUserByCategory: async (req, res) => {
    try {
      // Find all users with the specified category
      const users = await Users.find({ category: req.params.category }, { _id: 1, name: 1, pic: 1, bio: 1 });
  
      // Loop through each user and calculate the mutual friend count
      const updatedUsers = users.map(async user => {
        const mutualFriends = await Users.countDocuments({
          _id: { $in: user.friends },
          friends: req.user._id
        });
        return { ...user._doc, mutualFriends };
      });
  
      // Wait for all the async operations to complete
      const resolvedUsers = await Promise.all(updatedUsers);
  
      // sort by most recent
      const sortedUsers = resolvedUsers.sort((a, b) => b.createdAt - a.createdAt);
      // limit to 15 results
      const limitedUsers = sortedUsers.slice(0, 15);
  
      res.json(limitedUsers);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};
