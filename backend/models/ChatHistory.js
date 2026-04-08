import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role:        { type: String, enum: ["user", "assistant"], required: true },
  content:     { type: String, required: true },
  sources:     { type: mongoose.Schema.Types.Mixed, default: null },
  trace:       { type: mongoose.Schema.Types.Mixed, default: null },
  suggestions: { type: [String], default: [] },
  question:    { type: String, default: null },
}, { _id: false });

const chatHistorySchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  messages: { type: [messageSchema], default: [] },
}, { timestamps: true });

export const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);
