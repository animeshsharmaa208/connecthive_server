const express = require('express');
const {auth} = require('../middlewares/index');
const { pushNotifyToken }= require('../controller/pushNotifyToken');
const router = express.Router()

router.post('/pushNotifyToken', auth, pushNotifyToken.createPushNotifyToken);


//router.get('/conversations', auth, messageCtrl.getConversations)




module.exports = router