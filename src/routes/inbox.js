import express from "express";
import {
  getInbox,
  createConversation,
  deleteConversation,
  getMessages,
  sendMessage,
} from "../controllers/inbox.controller.js";
import decorateHtmlResponse from "../middlewares/common/decorate-html-response.middleware.js";
import { checkLogin } from "../middlewares/common/check-login.middleware.js";
import attachmentsUpload from "../middlewares/inbox/attachment-upload.middleware.js";

const router = express.Router();

// inbox page
router.get("/", decorateHtmlResponse("Inbox"), checkLogin, getInbox);

// create conversation
router.post("/conversation", checkLogin, createConversation);

// get messages
router.get("/messages/:conversationId", checkLogin, getMessages);

// send message
router.post("/messages", checkLogin, attachmentsUpload, sendMessage);

// delete conversation
router.delete("/conversation/:id", checkLogin, deleteConversation);

export default router;
