import express from "express";
import {
  getUsers,
  addUser,
  deleteUser,
  deleteLooggedInUser,
  searchUser,
} from "../controllers/user.controller.js";
import decorateHtmlResponse from "../middlewares/common/decorate-html-response.middleware.js";
import avatarUpload from "../middlewares/user/avatar-upload.middleware.js";
import {
  userValidatorHandler,
  userValidator,
} from "../middlewares/user/user-validator.middleware.js";

import { checkLogin } from "../middlewares/common/check-login.middleware.js";

const router = express.Router();

// users page
router.get("/", decorateHtmlResponse("Users"), checkLogin, getUsers);

// search user
router.post("/search", searchUser);

// add user
router.post("/", avatarUpload, userValidator, userValidatorHandler, addUser);

// delete user
router.delete("/delete-profile", checkLogin, deleteLooggedInUser);
//router.delete("/:id", checkLogin, deleteUser);

export default router;
