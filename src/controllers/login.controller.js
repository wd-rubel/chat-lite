import User from "../models/people.model.js";
import jwt from "jsonwebtoken";
import createError from "http-errors";
import bcrypt from "bcrypt";

function getLogin(req, res, next) {
  res.render("index");
}

// do login
async function login(req, res, next) {
  try {
    const user = await User.findOne({
      $or: [{ email: req.body.username }, { phone: req.body.username }],
    });

    if (!user) throw createError(401, "Login failed. Please try again.");

    const isValidPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!isValidPassword)
      throw createError(401, "Login failed. Please try again.");

    const userObject = {
      id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      role: "user",
    };

    const token = jwt.sign(userObject, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY,
    });

    res.cookie(process.env.COOKIE_NAME, token, {
      maxAge: process.env.JWT_EXPIRY,
      httpOnly: true,
      signed: true,
      secure: process.env.NODE_ENV === "production",
    });

    res.locals.loggedInUser = userObject;
    res.redirect("/inbox");
  } catch (error) {
    console.log("Login error:", error.message);

    res.render("index", {
      data: req.body.username,
      errors: {
        common: { msg: error.message },
      },
    });
  }
}

// update logged in user data
function updateLoggedInUserData(req, res, userObject) {
  // generate token
  const token = jwt.sign(userObject, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });

  // set cookie
  res.cookie(process.env.COOKIE_NAME, token, {
    maxAge: process.env.JWT_EXPIRY,
    httpOnly: true,
    signed: true,
    secure: process.env.NODE_ENV === "production",
  });

  // set logged in user data to loclas
  res.locals.loggedInUser = userObject;
  req.user = userObject;
  return userObject;
}

// logout
function logout(req, res, next) {
  res.clearCookie(process.env.COOKIE_NAME);
  res.send("logged out");
}

export { getLogin, login, logout, updateLoggedInUserData };
