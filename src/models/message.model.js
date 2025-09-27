import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
  sender: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    avatar: String,
  },
  receiver: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    avatar: String,
  },
  content: String,
  attachments: [String],
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

export default Message;
