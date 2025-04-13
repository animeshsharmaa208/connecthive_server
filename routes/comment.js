const express = require('express');
const {commentCtrl }= require('../controller/comment');
const {auth} = require('../middlewares/index')
const router = express.Router();

router.post('/comment',auth, commentCtrl.createComment)
router.patch('/comment/:id', auth, commentCtrl.updateComment)
router.patch('/comment/:id/like',auth, commentCtrl.likeComment)
router.patch('/comment/:id/unlike',auth, commentCtrl.unlikeComment)
router.delete('/comment/:id', auth, commentCtrl.deleteComment)

module.exports = router;