import express from "express";
import {
  getProfile,
  getPublicProfile,
  updateProfile,
  changePassword,
} from "../controllers/profile.controller.js";
import decorateHtmlResponse from "../middlewares/common/decorate-html-response.middleware.js";
import { checkLogin } from "../middlewares/common/check-login.middleware.js";
import avatarUpload from "../middlewares/user/avatar-upload.middleware.js";

const router = express.Router();

// public user profile
router.get(
  "/:id",
  decorateHtmlResponse("Profile"),
  checkLogin,
  getPublicProfile
);

// logggedin user profile
router.get("/", decorateHtmlResponse("Profile"), checkLogin, getProfile);

// update user profile
router.put("/", checkLogin, avatarUpload, updateProfile);

// change user password
router.patch(
  "/change-password",
  decorateHtmlResponse("Profile"),
  checkLogin,
  changePassword
);

export default router;
