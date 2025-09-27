import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        id: mongoose.Schema.Types.ObjectId,
        name: String,
        avatar: String,
      },
    ],
    lastUpdate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);


const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;