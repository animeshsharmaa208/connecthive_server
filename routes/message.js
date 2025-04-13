const express = require('express');
const {messageCtrl} = require('../controller/message')
const {auth} = require('../middlewares/index');
const router = express.Router()

router.post('/message', auth, messageCtrl.createMessage)

router.get('/conversations', auth, messageCtrl.getConversations)

router.get('/message/:id', auth, messageCtrl.getMessages)

router.delete('/message/:id', auth, messageCtrl.deleteMessages)

router.delete('/conversation/:id', auth, messageCtrl.deleteConversation)


module.exports = router