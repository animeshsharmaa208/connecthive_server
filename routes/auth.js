const express = require('express');
const { signup, signin, verifyEmail, sentForgotPasswordOtp, forgotPassword, getUserByUserId, getSingleUserByUserId, signout, signupWithGoogle, signinWithGoogle, verifyAccessToken } = require('../controller/auth');
const { auth } = require('../middlewares');

const router = express.Router();

//param route
router.param("userId", getUserByUserId);

//get route
router.get("/getUserByUserId/:userId", getSingleUserByUserId);

//post route
router.post('/signup', signup);
router.post('/signup/google', signupWithGoogle);
router.post('/signin', signin);
router.post('/signin/google', signinWithGoogle);
router.post('/verifyEmail', verifyEmail);
router.post('/signout', auth, signout)
router.post('/verifyToken', auth, verifyAccessToken);

router.post('/sendForgotPasswordOtp', sentForgotPasswordOtp);
router.post('/forgotPassword', forgotPassword);



module.exports = router