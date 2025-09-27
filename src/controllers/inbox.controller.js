import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/people.model.js";
import mongoose from "mongoose";

async function getInbox(req, res, next) {
  try {
    const conversations = await Conversation.find({
      "participants.id": req.user.id, // check if logged-in user is in participants
    }).sort({ lastUpdate: -1 });
    res.locals.data = conversations;

    res.render("inbox");
  } catch (error) {
    next(error);
  }
}

async function createConversation(req, res, next) {
  try {
    const { participantId } = req.body;
    const creatorId = req.user.id;

    const participant = await User.findById(participantId);

    if (!participant) {
      res.status(500).json({
        errors: {
          common: { msg: "Conversation can't be created!" },
        },
      });
    }

    const creatorName = req.user.name;
    const creatorAvatar = req.user.avatar;
    // Check if a conversation already exists between the two users
    let conversation = await Conversation.findOne({
      participants: {
        $all: [
          { $elemMatch: { id: new mongoose.Types.ObjectId(participantId) } },
          { $elemMatch: { id: new mongoose.Types.ObjectId(creatorId) } },
        ],
      },
    });

    if (!conversation) {
      // Create a new conversation if it doesn't exist
      conversation = new Conversation({
        creator: { id: creatorId, name: creatorName, avatar: creatorAvatar },
        participants: [
          {
            id: creatorId,
            name: creatorName,
            avatar: creatorAvatar,
          },
          {
            id: participantId,
            name: participant.name,
            avatar: participant.avatar,
          },
        ],
      });
      await conversation.save();
    }
    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({
      errors: {
        common: { msg: "Conversation can't be created!" },
      },
    });
  }
}

async function deleteConversation(req, res, next) {
  try {
    const conversationId = req.params.id;
    const conversation = await Conversation.findByIdAndDelete({
      _id: conversationId,
    });

    // delete associated messages if conversion deleted
    if (conversation) {
      await Message.deleteMany({ conversationId });
    }

    res.status(200).json({
      success: true,
      msg: "Conversation deleted successfully!",
    });
  } catch (error) {
    res.status(500).json({
      errors: {
        common: { msg: "Unable to delete conversation!" + req.params.id },
      },
    });
  }
}

async function getMessages(req, res, next) {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate("sender", "name avatar");

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        errors: {
          common: { msg: "Conversation not found!" },
        },
      });
    }

    res.status(200).json({
      participants: conversation.participants,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      errors: {
        common: { msg: "Unable to fetch messages!" },
      },
    });
  }
}

async function sendMessage(req, res, next) {
  const senderId = req.user.id;
  const senderName = req.user.name;
  const senderAvatar = req.user.avatar;

  try {
    const {
      conversationId,
      receiverId,
      receiverName,
      receiverAvatar,
      content,
    } = req.body;

    const attachments = req.files ? req.files.map((file) => file.filename) : [];
    const messageObj = {
      conversationId,
      sender: { id: senderId, name: senderName, avatar: senderAvatar },
      receiver: { id: receiverId, name: receiverName, avatar: receiverAvatar },
      content,
      attachments,
    };
    const message = new Message(messageObj);
    await message.save();

    // send via socket.io
    const io = req.app.get("io");
    io.to(conversationId.toString()).emit("newMessage", messageObj);

    res.status(201).json(message);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({
      errors: {
        common: { msg: "Unable to send message!" },
      },
    });
  }
}

export {
  getInbox,
  createConversation,
  deleteConversation,
  getMessages,
  sendMessage,
};
