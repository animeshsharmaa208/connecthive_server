const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/helper");
const User = require("../models/user");

// const multer = require('multer');
// const shortid = require('shortid');
// const path = require('path');

// const  storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, path.join(path.dirname(__dirname),'uploads'))
//     },
//     filename: function (req, file, cb) {
//       cb(null,shortid.generate() + '-' + file.originalname)
//     }
//   })

//   exports.upload = multer({storage});

// exports.auth = async (req, res, next) => {

//   if (req.headers.authorization) {
//     const token = req.headers.authorization.split(" ")[1];
//     const user = jwt.verify(token, process.env.ACCESSTOKENSECRET);
//     console.log(user);
//     const { _id } = user;
//     req.user = await User.findById(_id);
//   } else {
//     return res.status(400).json({ message: "Athorization required" });
//   }
//   next();
//   //jwt.decode()
// };

exports.auth = async (req, res, next) => {
  if (req.headers && req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    try {
      const decode = jwt.verify(token, process.env.ACCESSTOKENSECRET);
      const { _id } = decode;
      const user = await User.findById(_id);
      if (!user) {
        return res
          .status(401)
          .json({ success: false, error: "unauthorized access! 1" });
      }
      req.user = user;
      next();
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        return res
          .status(401)
          .json({ success: false, error: "unauthorized access! 2" });
      }
      if (error.name === "TokenExpiredError") {

        return res.status(440).json({
          success: false,
          error: "sesson expired try sign in!",
        });
      }

      res.res
        .status(401)
        .json({ success: false, error: "Internal server error!" });
    }
  } else {
    res.status(401).json({ success: false, error: "unauthorized access! 3" });
  }
};

exports.userMiddleware = (req, res, next) => {
  if (req.user.role !== "user") {
    return res.status(400).json({ message: "User Access denied" });
  }
  next();
};

exports.adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(400).json({ message: "Admin Access denied" });
  }
  next();
};

exports.isFriend = (req, res, next) => {
  
}
