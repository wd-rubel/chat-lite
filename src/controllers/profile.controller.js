import bcrypt from "bcrypt";
import createError from "http-errors";
import User from "../models/people.model.js";
import { updateLoggedInUserData } from "../controllers/login.controller.js";

async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -__v -createdAt -updatedAt"
    );
    res.render("profile", {
      user: user,
    });
  } catch (error) {
    next(error);
  }
}

async function getPublicProfile(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -__v -createdAt -updatedAt"
    );
    res.render("public-profile", {
      user: user,
      currentUser: req.user
    });
  } catch (error) {
    next(error);
  }
}

// Update Profile Controller
async function updateProfile(req, res, next) {
  try {
    const currentUser = req.user; // user from auth middleware
    const { name, email, phone, avatar, currentPassword, newPassword } =
      req.body;

    // find user by current email
    let user = await User.findOne({ email: currentUser.email });
    if (!user) {
      throw createError(404, "User not found!");
    }
    
    // if profile info update is requested
    if (name || phone || email || avatar || newPassword) {
      // check current password first
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isValidPassword) {
        throw createError(401, "Invalid password!");
      }

      // update profile fields
      if (name) user.name = name;
      if (email) user.email = email;
      if (phone) user.phone = phone;

      if(req.files && req.files.length > 0) {
        user.avatar = req.files[0].filename;
      }

      // update password if newPassword provided
      if (newPassword) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
      }
      const savedUser = await user.save();
      const updatedUserObject = {
        id: savedUser.id,
        name: savedUser.name,
        phone: savedUser.phone,
        email: savedUser.email,
        avatar: savedUser.avatar,
        role: "user",
      };

      updateLoggedInUserData(req, res, updatedUserObject);

      res.status(200).json({
        success: true,
        message: "Profile updated successfully!",
        data: updatedUserObject,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "No fields to update!",
      });
    }
  } catch (error) {
    console.log("error", error);

    res.status(500).json({
      errors: {
        common: {
          msg: error.message,
        },
      },
    });
  }
}

async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select("password");
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        errors: { oldPassword: { msg: "Old password is incorrect!" } },
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res
      .status(200)
      .json({ success: true, msg: "Password changed successfully!" });
  } catch (error) {
    next(error);
  }
}
export { getProfile, getPublicProfile, updateProfile, changePassword };
