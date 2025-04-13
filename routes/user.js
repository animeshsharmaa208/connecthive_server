const router = require('express').Router();
const {userCtrl }= require('../controller/user');
const {auth} = require('../middlewares/index')

router.get('/search',auth, userCtrl.searchUser)
router.get('/search/friends',auth, userCtrl.searchFriends)
router.get('/user/:id',auth, userCtrl.getUser)
router.get('/user',auth, userCtrl.getOnlyUser)
router.patch('/user',auth, userCtrl.updateUser);
router.patch('/submitQuestions',auth, userCtrl.updateQuestions);
router.get('/user/:recipientId/sendFriendRequest/',auth, userCtrl.sendFriendRequest);
router.get('/user/:recipientId/unsendFriendRequest/',auth, userCtrl.unsendFriendRequest);
router.get('/user/getAllFriendRequest/:id',auth, userCtrl.getAllFriendRequest);
router.patch('/user/:id/friend',auth, userCtrl.friend);
router.patch('/user/:id/unfriend',auth, userCtrl.unfriend);
router.patch('/user/:id/block',auth, userCtrl.blockUser);
router.patch('/user/:id/unblock',auth, userCtrl.unblockUser);
router.get('/suggestion', auth,  userCtrl.suggestUser);
router.get('/top-users/:category', auth, userCtrl.getLatestUserByCategory);


module.exports = router;