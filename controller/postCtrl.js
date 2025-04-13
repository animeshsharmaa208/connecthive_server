const Post = require("../models/post");
const User = require("../models/user");
const Report = require("../models/reportModel");
const Comment = require("../models/commentModel");
const Repost = require("../models/rePost");
const cloudinary = require("cloudinary").v2;
const Notifies = require("../models/notify");

cloudinary.config({
  secure: true,
});

class APIfeatures {
  constructor(query, queryString) {
    console.log(queryString);

    this.query = query;
    this.queryString = queryString;
  }

  paginating() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 25;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

exports.postCtrl = {
  createPost: async (req, res) => {
    try {
      const { content, images, docs, video } = req.body;
      const newPost = new Post({
        content,
        images,
        docs,
        video,
        user: req.user._id,
      });
      await newPost.save();

      return res.status(200).json({
        msg: "Post saved",
        newPost: {
          ...newPost._doc,
          user: req.user,
        },
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
  getPost: async (req, res) => {
    try {
      const features = new APIfeatures(
        Post.find({
          user: {
            $in: [...req.user.friends, req.user._id],
            $nin: req.user.blocked,
          },
        }),
        req.query
      ).paginating();

      const repostFeatures = new APIfeatures(
        Repost.find({
          repostedBy: {
            $in: [...req.user.friends, req.user._id],
            $nin: req.user.blocked,
          },
        }),
        req.query
      ).paginating();

      // const posts = await Post.find({
      //   user: { $in: req.user.friends ,  $nin: req.user.blocked },
      // })

      const posts = await features.query
        .sort("-createdAt")
        // .sort("-createdAt")
        .populate("user", " _id name pic")
        .populate({
          path: "comments",
          populate: {
            path: "user likes",
            select: "-password",
          },
        })
        .populate("likes", "_id name pic email");

      // const rePosts = await Repost.find({
      //   repostedBy: { $in: req.user.friends, $nin: req.user.blocked },
      // })
      const rePosts = await repostFeatures.query
        .sort("-createdAt")
        .populate("repostedBy", "_id name pic")
        .populate({
          path: "postId",
          populate: {
            path: "user likes",
            select: "-password",
          },
        })
        .populate({
          path: "postId",
          populate: {
            path: "comments",
            populate: {
              path: "user",
            },
          },
        });

      const finalfeed = posts.concat(...rePosts).sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      return res.status(200).json({
        message: "post found",
        result: finalfeed.length,
        posts: finalfeed,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
  updatePost: async (req, res) => {
    try {
      let imgArr = [];

      const { content, images } = req.body;
      const postDataOld = await Post.findById(req.params.id);

      if (postDataOld) {
        // console.log(postDataOld?.images);

        for (const item of postDataOld.images) {
          const des = await cloudinary.uploader.destroy(item.public_id);
          imgArr.push(des);
        }
      }

      const post = await Post.findOneAndUpdate(
        { _id: req.params.id },
        {
          content,
          images,
        }
      ).populate("user likes", "username avatar fullname");

      return res.status(200).json({
        message: "Post update",
        newPost: {
          ...post._doc,
          content,
          images,
        },
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  likePost: async (req, res) => {
    try {
      const post = await Post.find({ _id: req.params.id, likes: req.user._id });

      if (post.length > 0)
        return res.status(400).json({ msg: "you have already like this post" });

      const like = await Post.findOneAndUpdate(
        { _id: req.params.id },
        {
          $push: { likes: req.user._id },
        },
        { new: true }
      );

      if (!like) return res.status(400).json({ error: "no post found" });
      like.populate("user", function (err) {
        return res.json(like);
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  savePost: async (req, res) => {
    try {
      const user = await User.find({ _id: req.user._id, saved: req.params.id });

      if (user.length > 0)
        return res.status(400).json({ msg: "you have already save this post" });

      await User.findOneAndUpdate(
        { _id: req.user._id },
        {
          $push: { saved: req.params.id },
        },
        { new: true }
      );

      return res.json({
        msg: "Post Saved",
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  unsavePost: async (req, res) => {
    try {
      await User.findOneAndUpdate(
        { _id: req.user._id },
        {
          $pull: { saved: req.params.id },
        },
        { new: true }
      );

      return res.json({
        msg: "Post unSaved",
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  unlikePost: async (req, res) => {
    try {
      const unlike = await Post.findOneAndUpdate(
        { _id: req.params.id },
        {
          $pull: { likes: req.user._id },
        },
        { new: true }
      );

      if (!unlike) return res.status(400).json({ message: "no post found" });
      unlike.populate("user", function (err) {
        return res.json(unlike);
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  getsavedPost: async (req, res) => {
    try {
      const savedposts = await Post.find({ _id: { $in: req.user.saved } })
        .sort("-createdAt")
        .populate("user likes", "username avatar fullname");

      return res.json({
        msg: "something",
        savedposts,
      });
    } catch (err) {
      return res.status(500).json({ msg: "wrong" });
    }
  },

  getUserPost: async (req, res) => {
    try {
      const posts = await Post.find({ user: req.params.id })
        .sort("-createdAt")
        .populate("user likes", "_id name pic")
        .populate({
          path: "comments",
          populate: {
            path: "user likes",
            select: "-password",
          },
        });

      const rePosts = await Repost.find({
        repostedBy: req.params.id,
      })
        .populate("repostedBy", "_id name pic")
        .populate({
          path: "postId",
          populate: {
            path: "user likes",
            select: "-password",
          },
        })
        .populate({
          path: "postId",
          populate: {
            path: "comments",
            populate: {
              path: "user",
            },
          },
        });

      const finalfeed = posts.concat(...rePosts).sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      return res.status(200).json({
        msg: "post found",
        result: posts.length,
        posts: finalfeed,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  getSinglePost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id).populate({
        path: "comments",
        populate: {
          path: "user likes",
          select: "-password",
        },
      });

      return res.status(200).json({
        post,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  deletePost: async (req, res) => {
    try {
      const postD = await Post.findById({
        _id: req.params.id,
        user: req.user._id,
      });

      if (postD) {
        // console.log(postDataOld?.images);
        if (postD.images.length > 0) {
          for (const item of postD.images) {
            const des = await cloudinary.uploader.destroy(item.public_id);
          }
        } else if (postD.docs.length > 0) {
          const des = await cloudinary.uploader.destroy(
            postD?.docs[0]?.public_id,
            { resource_type: "raw" }
          );
        } else if (postD.video.length > 0) {
          const des = await cloudinary.uploader.destroy(
            postD?.video[0]?.public_id,
            { resource_type: "video" }
          );
        }
      }

      const post = await Post.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id,
      });
      await Comment.deleteMany({ _id: { $in: post.comments } });
      await Notifies.deleteMany({ post: req.params.id });
      await Repost.deleteMany({ postId: req.params.id });

      return res.json({
        message: "Post deleted",
        newPost: {
          ...post,
          user: req.user,
        },
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  reportPost: async (req, res) => {
    try {
      const { reason } = req.body;

      const post = await Post.findById(req.params.id);

      if (!post) return res.status(400).json({ error: "no post found" });

      const report = await Report.find({
        reportedBy: req.user._id,
        postId: req.params.id,
      });
      if (report.length > 0)
        return res
          .status(400)
          .json({ error: "you have already reported this post" });

      const newReport = await new Report({
        reason,
        postId: req.params.id,
        reportedBy: req.user._id,
      });

      await Post.findOneAndUpdate(
        { _id: req.params.id },
        {
          $push: { reports: newReport._id },
        }
      );

      await newReport.save();
      return res.json({ message: "reported successfully", newReport });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  rePost: async (req, res) => {
    try {
      const newRePost = new Repost({
        repostedBy: req.user._id,
        postId: req.params.id,
        quotes: req.body.quotes,
      });

      await Post.findOneAndUpdate(
        { _id: req.params.id },
        {
          $push: { reposts: req.user._id },
        },
        { new: true }
      );

      await newRePost.save();

      return res.status(200).json({
        message: "Re-posted succssfully",
        newRePost: {
          ...newRePost._doc,
          user: req.user,
        },
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  deleteRepost: async (req, res) => {
    try {
      const repost = await Repost.findOneAndDelete({
        _id: req.params.id,
        repostedBy: req.user._id,
      });

      const repostCount = await Post.findOneAndUpdate(
        { _id: req.params.postId },
        {
          $pull: { reposts: req.user._id },
        },
        { new: true }
      );

      return res.json({
        message: "Repost deleted",
        newPost: {
          ...repost,
          user: req.user,
        },
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
};
