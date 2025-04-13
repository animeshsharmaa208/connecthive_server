const Notifies = require("../models/notify");
const { sendPushNotification } = require("../utils/helper");

exports.notifyCtrl = {
  createNotify: async (req, res) => {
    try {
      const { recipient, url, text, content, image, post, screen } = req.body;
      if (recipient === req.user._id.toString()) return;

      const notify = new Notifies({
        recipient,
        url,
        text,
        content,
        image,
        user: req.user._id,
        post,
        screen,
      });

      await notify.save();
      // sendPushNotification(recipient, req.user._id, text ,result={ type: "notify"}, req.user.name, "notify")
      return res.json(notify);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
  removeNotify: async (req, res) => {
    try {
      const notify = await Notifies.findOneAndDelete({
        id: req.params.id,
        url: req.query.url,
      });

      return res.json({ notify });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  getNotifies: async (req, res) => {
    try {
      const notifies = await Notifies.find({ recipient: req.user._id })
        .sort("-createdAt")
        .populate("user", "-password")
        .populate({
          path: "post",
          populate: {
            path: "user",
          },
        });

      return res.json(notifies);
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  isReadNotify: async (req, res) => {
    try {
        const ids = req.params.ids.split(',');
        
        const notifies = await Notifies.updateMany({ _id: { $in: ids } }, {
            $set: { isRead: true }
        });

      return res.json({ notifies });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  deleteAllNotifies: async (req, res) => {
    try {
      const notifies = await Notifies.deleteMany({ recipients: req.user._id });

      return res.json({ notifies });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
};
