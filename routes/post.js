const express = require('express');
const { signup } = require('../controller/auth');
const {postCtrl }= require('../controller/postCtrl');
const {auth} = require('../middlewares/index')
const router = express.Router();

router.route('/posts')
.post(auth, postCtrl.createPost)
.get(auth, postCtrl.getPost)

router.route('/post/:id')
.patch(auth, postCtrl.updatePost)
.get(auth, postCtrl.getSinglePost)
.delete(auth,postCtrl.deletePost)

router.route('/repost/:id/:postId')
.delete(auth,postCtrl.deleteRepost)

router.patch('/post/:id/like',auth, postCtrl.likePost)
router.patch('/post/:id/unlike',auth, postCtrl.unlikePost)
router.patch('/post/:id/report',auth, postCtrl.reportPost)
router.post('/post/:id/repost',auth, postCtrl.rePost)
router.get('/userposts/:id',auth,postCtrl.getUserPost)
router.patch('/save/:id',auth,postCtrl.savePost)
router.patch('/unsave/:id',auth,postCtrl.unsavePost)

router.get('/savedPost',auth,postCtrl.getsavedPost);




module.exports = router