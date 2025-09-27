import express from "express";
import { getLogin, login, logout } from "../controllers/login.controller.js";
import {
  loginValidators,
  validationHandler,
} from "../middlewares/login/login-validator.middleware.js";
import decorateHtmlResponse from "../middlewares/common/decorate-html-response.middleware.js";
import { redirectLoggedInUser } from "../middlewares/common/check-login.middleware.js";

const router = express.Router();
const pageTitle = "Login";

// index page
router.get(
  "/",
  decorateHtmlResponse(pageTitle),
  redirectLoggedInUser,
  getLogin
);

// login page
router.get(
  "/login",
  decorateHtmlResponse(pageTitle),
  redirectLoggedInUser,
  getLogin
);

// process login
router.post(
  "/",
  decorateHtmlResponse(pageTitle),
  loginValidators,
  validationHandler,
  login
);

// process logout
router.delete("/logout", logout);

export default router;
