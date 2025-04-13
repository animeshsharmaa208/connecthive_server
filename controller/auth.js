// const divyanshu = require("divyanshu"); this will be error becouse divyanshu dose not exsist
const { sendError } = require("../utils/helper");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { generateOTP } = require("../utils/mail");
const VerificationToken = require("../models/verificationToken");
const { isValidObjectId } = require("mongoose");

const Mailjet = require("node-mailjet");
const resetToken = require("../models/resetToken");
const PushNotifyToken = require("../models/pushNotifyToken");
const mailjet = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);

const createAccessToken = (_id, role) => {
  return jwt.sign({ _id, role }, process.env.ACCESSTOKENSECRET, {
    expiresIn: "1d",
  });
};

const createRefreshToken = (_id, role) => {
  return jwt.sign({ _id, role }, process.env.REFRESHTOKENSECRET, {
    expiresIn: "30d",
  });
};

const removePushNotifyToken = async (token, userId) => {
  const user = await User.findOne({ _id: userId });

  if (!user) return res.status(400).json({ error: "No user exist" });
  const notifyToken = await PushNotifyToken.findOne({ user: user._id });
  if (notifyToken) {
    if (notifyToken.token.includes(token)) {
      const removedNotifyToken = await PushNotifyToken.findOneAndUpdate(
        { user: user._id },
        {
          $pull: { token: token },
        },
        { new: true }
      ).populate("user");
      return { success: true, removedNotifyToken };
    }
  }
  if (!notifyToken) {
    return { success: true };
  }
};

exports.generateAccessToken = async (req, res) => {
  try {
    const rf_token = req.cookies.refreshtoken;

    if (!rf_token) return res.status(400).json({ msg: "please login now" });

    jwt.verify(
      rf_token,
      process.env.REFRESHTOKENSECRET,
      async (err, result) => {
        if (err) return sendError(res, "Please login now");

        const user = await User.findById(result.id)
          .select("-password")
          .populate("friends following");

        if (!user) return sendError(res, "user does not exist");

        const access_token = createAccessToken(result.id, user.role);

        res.json({
          access_token,
          user,
        });
      }
    );
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

//params controller
exports.getUserByUserId = (req, res, next, id) => {
  User.findById({ _id: id }).exec((error, userApproval) => {
    if (error) {
      return res.status(400).json({
        error: "User not found in DB",
      });
    }
    req.userApproval = userApproval;
    next();
  });
};

//get route
exports.getSingleUserByUserId = (req, res) => {
  if (req.userApproval) {
    const { _id, name, email, role, mobile, verified, approved } =
      req.userApproval;
    const userApproval = req.userApproval;
    return res.status(200).json({
      userApproval: { _id, name, email, role, mobile, verified, approved },
    });
  }
};

exports.signup = (req, res) => {
  User.findOne({ email: req.body.email }).exec(async (error, user) => {
    if (user && user.verified && user.approved) {
      return sendError(res, "Email is already in use! Please login");
    } else if (user && user.verified && !user.approved) {
      return sendError(
        res,
        "Your Account is in approval phase. Please wait till approval"
      );
    } else if (user && !user.verified) {
      const { _id, name, email, role, mobile } = user;

      await VerificationToken.findOneAndDelete({ owner: _id });

      const OTP = generateOTP();

      const verificationToken = new VerificationToken({
        owner: user._id,
        token: OTP,
      });
      await verificationToken.save();

      mailjet.post("send", { version: "v3.1" }).request({
        Messages: [
          {
            From: {
              Email: "insights@radicallyyours.com",
              Name: "Wipe",
            },
            To: [
              {
                Email: `${req.body.email}`,
              },
            ],
            Subject: "Verify your email account",
            HTMLPart: `
                <div style="max-width: 500px">
                <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2, align-items: center">
                  <div style="margin:50px auto;width:70%;padding:20px 0">
                    <div style="border-bottom:1px solid #eee">
                      <a href="" style="font-size:1.4em;color: #7c201f ;text-decoration:none;font-weight:600">Radically Yours</a>
                    </div>
                    <p style="font-size:1.1em">Hi,</p>
                    <p>Thank you for choosing Wipe. Use the following OTP to complete your Sign Up procedures.</p>
                    <h2 style="background: #7c201f;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${OTP}</h2>
                    <p style="font-size:0.9em;">Regards,<br />Wipe</p>
                    <hr style="border:none;border-top:1px solid #eee" />
                    <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                      <p>Radhikal Ventures Inc. USA
                      NYC, New York
                      India office:
                      717-B, One BKC,
                      Mumbai – 51</p>
                      <p></p>
                    </div>
                  </div>
                </div>
                </div>`,
          },
        ],
      });

      return res.status(201).json({
        message: "user registered successfully",
        user: { _id, name, email, role, mobile },
      });
    }
    const { name, email, password, mobile } = req.body;
    const hash_password = await bcrypt.hash(password, 10);
    const _user = new User({
      name: name.toLowerCase(),
      email,
      password: hash_password,
      mobile,
    });

    const OTP = generateOTP();

    const verificationToken = new VerificationToken({
      owner: _user._id,
      token: OTP,
    });

    await verificationToken.save();
    _user.save((error, user) => {
      if (error) {
        return sendError(
          res,
          "something went wrong! Please try again later..."
        );
      }
      if (user) {
        const { _id, name, email, role, mobile } = user;

        mailjet.post("send", { version: "v3.1" }).request({
          Messages: [
            {
              From: {
                Email: "insights@radicallyyours.com",
                Name: "Wipe",
              },
              To: [
                {
                  Email: `${email}`,
                },
              ],
              Subject: "Verify your email account",
              HTMLPart: `
                    <div style="max-width: 500px">
                    <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2, align-items: center">
                      <div style="margin:50px auto;width:70%;padding:20px 0">
                        <div style="border-bottom:1px solid #eee">
                          <a href="" style="font-size:1.4em;color: #7c201f ;text-decoration:none;font-weight:600">Radically Yours</a>
                        </div>
                        <p style="font-size:1.1em">Hi,</p>
                        <p>Thank you for choosing Wipe. Use the following OTP to complete your Sign Up procedures.</p>
                        <h2 style="background: #7c201f;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${OTP}</h2>
                        <p style="font-size:0.9em;">Regards,<br />Wipe</p>
                        <hr style="border:none;border-top:1px solid #eee" />
                        <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                          <p>Radhikal Ventures Inc. USA
                          NYC, New York
                          India office:
                          717-B, One BKC,
                          Mumbai – 51</p>
                          <p></p>
                        </div>
                      </div>
                    </div>
                    </div>`,
            },
          ],
        });

        return res.status(201).json({
          message: "user registered successfully",
          user: { _id, name, email, role, mobile },
        });
      }
    });
  });
};

exports.verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;
  console.log(req.body);
  if (!userId || !otp.trim())
    return sendError(res, "Invalid request!, Missing parameters");

  if (!isValidObjectId(userId)) return sendError(res, "Invalid user");

  const user = await User.findById(userId);
  if (!user) return sendError(res, "User not found");

  if (user.verified) return sendError(res, "Your email is already verified");

  const token = await VerificationToken.findOne({ owner: user._id });
  if (!token) return sendError(res, "Sorry User not found");

  const isMatched = await token.compareToken(otp);

  if (!isMatched) return sendError(res, "Invalid otp");

  user.verified = true;

  await VerificationToken.findByIdAndDelete(token._id);
  await user.save();

  mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "insights@radicallyyours.com",
          Name: "Wipe",
        },
        To: [
          {
            Email: `${user.email}`,
          },
        ],
        Subject: "Email Verified",
        HTMLPart: `
                  <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2, align-items: center">
                    <div style="margin:50px auto;width:70%;padding:20px 0">
                      <div style="border-bottom:1px solid #eee">
                        <a href="" style="font-size:1.4em;color: #7c201f;text-decoration:none;font-weight:600">Radically Yours</a>
                      </div>
                      <p style="font-size:1.1em">Hi,</p>
                      <p>Thank you for choosing Wipe.Your account is now verified.</p>
                      <p style="font-size:0.9em;">Regards,<br />Wipe</p>
                      <hr style="border:none;border-top:1px solid #eee" />
                      <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                      <p>Radhikal Ventures Inc. USA
                      NYC, New York
                      India office:
                      717-B, One BKC,
                      Mumbai – 51</p>
                        <p></p>
                      </div>
                    </div>
                  </div>`,
      },
    ],
  });

  res.json({
    success: true,
    message: "Your email is successfully verified",
    user: {
      name: user.name,
      email: user.email,
      id: user._id,
      role: user.role,
      verified: user.verified,
    },
  });
};

exports.signin = (req, res) => {
  User.findOne({ email: req.body.email }).exec(async (error, user) => {
    if (error) return res.status(400).json({ error });
    if (user) {
      if (!user.password) {
        return res
          .status(400)
          .json({ message: "Please create your password from fogot password" });
      }
      if (
        await user.authenticate(req.body.password)
        // && user.role === "admin"
      ) {
        if (true) {
          const access_token = createAccessToken(user._id, user.role);
          // const refresh_token = createRefreshToken(user._id, user.role);
          const {
            _id,
            name,
            email,
            role,
            mobile,
            pic,
            linkedinProfile,
            bio,
            website,
            approved,
            friends,
          } = user;

          // res.cookie("refreshtoken", refresh_token, {
          //   httpOnly: true,
          //   path: "/api/refresh_token",
          //   maxAge: 24 * 30 * 60 * 60 * 1000, //30days
          // });
          res.status(200).json({
            access_token,
            user: {
              _id,
              name,
              email,
              role,
              mobile,
              pic,
              linkedinProfile,
              bio,
              website,
              approved,
              friends,
            },
          });
        } else {
          sendError(
            res,
            "Your account is in approval phase, We will notify you once account is approved"
          );
        }
      } else {
        return res.status(400).json({
          message: "Email Password does not match",
        });
      }
    } else if (!user) {
      return res.status(400).json({ message: "User Not Registered" });
    } else {
      return res
        .status(400)
        .json({ message: "Something went wrong ! Please try again later..." });
    }
  });
};

exports.signout = async (req, res) => {
  const { pushNotifyToken } = req.body;
  try {
    res.clearCookie("refreshtoken", { path: "/api/refresh_token" });
    removePushNotifyToken(pushNotifyToken, req.user._id);
    res.json({ message: "Logged out" });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

exports.sentForgotPasswordOtp = (req, res) => {
  const { email } = req.body;
  if (!email) return sendError(res, "Please provide valid email");

  User.findOne({ email }).exec((error, user) => {
    if (error) {
      return sendError(res, error.message);
    }
    if (!user) {
      return sendError(res, "User not found!");
    }
    if (user) {
      resetToken.findOne({ owner: user._id }).exec(async (error, token) => {
        if (error) return sendError(res, error.message);
        if (token) {
          return sendError(res, "You can send only one otp in one hour");
        }
        const OTP = generateOTP();

        const _resetToken = new resetToken({
          owner: user._id,
          token: OTP,
        });
        _resetToken.save((error, token) => {
          if (error) {
            return sendError(res, "Unable to generate otp! Please try again");
          }
          if (token) {
            console.log(token);
            mailjet.post("send", { version: "v3.1" }).request({
              Messages: [
                {
                  From: {
                    Email: "insights@radicallyyours.com",
                    Name: "Wipe",
                  },
                  To: [
                    {
                      Email: `${email}`,
                    },
                  ],
                  Subject: "Forgot your password",
                  HTMLPart: `
                      <div style="max-width: 500px">
                      <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2, align-items: center">
                        <div style="margin:50px auto;width:70%;padding:20px 0">
                          <div style="border-bottom:1px solid #eee">
                            <a href="" style="font-size:1.4em;color: #7c201f ;text-decoration:none;font-weight:600">Radically Yours</a>
                          </div>
                          <p style="font-size:1.1em">Hi,</p>
                          <p>Thank you for choosing Wipe. Use the following OTP to reset your password.</p>
                          <h2 style="background: #7c201f;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${OTP}</h2>
                          <p style="font-size:0.9em;">Regards,<br />Wipe</p>
                          <hr style="border:none;border-top:1px solid #eee" />
                          <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                            <p>Radhikal Ventures Inc. USA
                            NYC, New York
                            India office:
                            717-B, One BKC,
                            Mumbai – 51</p>
                            <p></p>
                          </div>
                        </div>
                      </div>
                      </div>`,
                },
              ],
            });
            return res
              .status(201)
              .json({ message: "Otp sent successfully", user });
          }
        });
      });
    }
  });
};

exports.forgotPassword = async (req, res) => {
  const { userId, otp, password } = req.body;
  if (!userId || !otp.trim())
    return sendError(res, "Invalid request!, Missing parameters");

  if (!isValidObjectId(userId)) return sendError(res, "Invalid user");

  const user = await User.findById(userId);
  if (!user) return sendError(res, "User not found");

  const token = await resetToken.findOne({ owner: user._id });
  if (!token) return sendError(res, "Otp expired Please generate new one");

  const isMatched = await token.compareToken(otp);

  if (!isMatched) return sendError(res, "Invalid otp");

  const hash_password = await bcrypt.hash(password.trim(), 10);

  if (user.password) {
    const isSamePassword = await user.authenticate(password);
    if (isSamePassword) return sendError(res, "New password must be different");
  }

  user.password = hash_password;
  user.save(async (error, resetUser) => {
    if (error) {
      return sendError(res, "Failed to update password");
    }
    if (resetUser) {
      await resetToken.findByIdAndDelete(token._id);

      mailjet.post("send", { version: "v3.1" }).request({
        Messages: [
          {
            From: {
              Email: "insights@radicallyyours.com",
              Name: "Wipe",
            },
            To: [
              {
                Email: `${user.email}`,
              },
            ],
            Subject: "Your password changed successfully",
            HTMLPart: `
                        <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2, align-items: center">
                          <div style="margin:50px auto;width:70%;padding:20px 0">
                            <div style="border-bottom:1px solid #eee">
                              <a href="" style="font-size:1.4em;color: #7c201f;text-decoration:none;font-weight:600">Radically Yours</a>
                            </div>
                            <p style="font-size:1.1em">Hi,</p>
                            <p>Thank you for choosing Wipe.Your wipe password is successfully changed. if this is not by you then please reply to this mail.</p>
                            <p style="font-size:0.9em;">Regards,<br />Wipe</p>
                            <hr style="border:none;border-top:1px solid #eee" />
                            <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                            <p>Radhikal Ventures Inc. USA
                            NYC, New York
                            India office:
                            717-B, One BKC,
                            Mumbai – 51</p>
                              <p></p>
                            </div>
                          </div>
                        </div>`,
          },
        ],
      });
      return res.status(200).json({
        message: "password reset successfully",
      });
    }
  });
};

exports.signupWithGoogle = async (req, res) => {
  User.findOne({ email: req.body.email }).exec(async (error, user) => {
    if (user && user.verified) {
      return sendError(res, "Email is already in use! Please login");
    } else if (user && !user.verified) {
      const { name } = user;

      const user = await User.findOneAndUpdate(
        { _id: req.user._id },
        {
          verified: true,
          registeredBy: "google",
        },
        { returnDocument: "after" }
      );
      return res.json({
        message: `${name} registered successfully, Please login!`,
        user,
      });
    }
    const { name, email, picture } = req.body;
    const _user = new User({
      name: name.toLowerCase(),
      email,
      pic: picture,
      verified: true,
      registeredBy: "google",
    });

    _user.save((error, user) => {
      if (error) {
        return sendError(
          res,
          "something went wrong! Please try again later..."
        );
      }
      if (user) {
        const { _id, name, email, role, mobile, approved } = user;

        mailjet.post("send", { version: "v3.1" }).request({
          Messages: [
            {
              From: {
                Email: "insights@radicallyyours.com",
                Name: "Wipe",
              },
              To: [
                {
                  Email: `${email}`,
                },
              ],
              Subject: "Account Registered Successfully",
              HTMLPart: `
                    <div style="max-width: 500px">
                    <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2, align-items: center">
                      <div style="margin:50px auto;width:70%;padding:20px 0">
                        <div style="border-bottom:1px solid #eee">
                          <a href="" style="font-size:1.4em;color: #7c201f ;text-decoration:none;font-weight:600">Radically Yours</a>
                        </div>
                        <p style="font-size:1.1em">Hi ${name},</p>
                        <p>Thank you for choosing Wipe.Your account is registered successfully Please wait till approval from our admin team.</p>
                        <p style="font-size:0.9em;">Regards,<br />Wipe</p>
                        <hr style="border:none;border-top:1px solid #eee" />
                        <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                          <p>Radhikal Ventures Inc. USA
                          NYC, New York
                          India office:
                          717-B, One BKC,
                          Mumbai – 51</p>
                          <p></p>
                        </div>
                      </div>
                    </div>
                    </div>`,
            },
          ],
        });

        return res.status(201).json({
          message: "user registered successfully",
          user: { _id, name, email, role, mobile, approved },
        });
      }
    });
  });
};

exports.signinWithGoogle = (req, res) => {
  console.log(req.body.email);
  User.findOne({ email: req.body.email }).exec(async (error, user) => {
    if (error) return res.status(400).json({ error });
    if (user) {
      const access_token = createAccessToken(user._id, user.role);
      // const refresh_token = createRefreshToken(user._id, user.role);
      const {
        _id,
        name,
        email,
        role,
        mobile,
        pic,
        linkedinProfile,
        bio,
        website,
        approved,
        friends,
      } = user;

      // res.cookie("refreshtoken", refresh_token, {
      //   httpOnly: true,
      //   path: "/api/refresh_token",
      //   maxAge: 24 * 30 * 60 * 60 * 1000, //30days
      // });
      res.status(200).json({
        access_token,
        user: {
          _id,
          name,
          email,
          role,
          mobile,
          pic,
          linkedinProfile,
          bio,
          website,
          approved,
          friends,
        },
      });
    } else if (!user) {
      return res
        .status(400)
        .json({ message: "User Not Registered, Please register first" });
    } else {
      return res
        .status(400)
        .json({ message: "Something went wrong ! Please try again later..." });
    }
  });
};

exports.verifyAccessToken = (req, res) => {
  res.status(200).json({ message: "ok" });
};
