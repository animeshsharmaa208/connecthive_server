const express = require('express');
const {auth }= require('../middlewares/index')
const {notifyCtrl }= require('../controller/notifyCtrl');
const router = express.Router();


router.post('/notify', auth, notifyCtrl.createNotify)

router.delete('/notify/:id', auth, notifyCtrl.removeNotify)

router.get('/notifies', auth, notifyCtrl.getNotifies)

router.patch('/isReadNotify/:ids', auth, notifyCtrl.isReadNotify)

router.delete('/deleteAllNotify', auth, notifyCtrl.deleteAllNotifies)



module.exports = router