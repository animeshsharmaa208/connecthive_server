const PushNotifyToken = require("../models/pushNotifyToken");
const User = require("../models/user");
const { Expo } = require("expo-server-sdk");

exports.pushNotifyToken = {
  createPushNotifyToken: async (req, res) => {
    try {
      const { token } = req.body;
      const user = await User.findOne({ _id: req.user._id });

      if (!user) return res.status(400).json({ error: "No user exist" });
      const notifyToken = await PushNotifyToken.findOne({ user: user._id });
      if (notifyToken) {
        if (notifyToken.token.includes(token)) {
          return res.status(400).json({ error: "token already exist" });
        } else {
          const newNotifyToken = await PushNotifyToken.findOneAndUpdate(
            { user: user._id },
            {
              $push: { token: token },
            },
            { new: true }
          ).populate("user");
          res.json({
            newNotifyToken,
            message: "notify token saved succesfully",
          });
        }
      }
      if (!notifyToken) {
        const newPushNotifyToken = new PushNotifyToken({
          token,
          user: req.user._id,
        });

        const result = await newPushNotifyToken.save();

        return res.status(200).json({
          message: "Push notify token saves",
          result,
        });
      }
    } catch (err) {
      console.log(err)
      return res.status(500).json({ error: err.message });
    }
  },

  getPushNotifyToken: async (req, res) => {},

 
};
