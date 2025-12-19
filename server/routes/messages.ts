import type { Express } from "express";
import { storage } from "../storage";

export function registerMessageRoutes(app: Express) {
  // MESSAGES
  app.get("/api/messages/conversations", async (req, res) => {
    try {
      const userId = Number(req.query.userId); // In a real app, this would come from session
      if (!userId) return res.status(400).json({ error: "User ID required" });
      
      const conversations = await storage.listConversations(userId);
      res.json(conversations);
    } catch (error: any) {
      console.error("Error listing conversations:", error);
      res.status(500).json({ error: "Failed to list conversations", details: error.message });
    }
  });

  app.get("/api/messages/:otherUserId", async (req, res) => {
    try {
      const userId = Number(req.query.userId); // User inquiring
      const otherUserId = Number(req.params.otherUserId);
      if (!userId) return res.status(400).json({ error: "User ID required" });

      const messages = await storage.listMessages(userId, otherUserId);
      res.json(messages);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages", details: error.message });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const message = await storage.createMessage(req.body);
      res.json(message);
    } catch (error: any) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message", details: error.message });
    }
  });

  app.patch("/api/messages/:otherUserId/read", async (req, res) => {
    try {
      const userId = Number(req.body.userId);
      const otherUserId = Number(req.params.otherUserId);
      if (!userId) return res.status(400).json({ error: "User ID required" });

      // If I am userId, I am reading messages sent BY otherUserId
      await storage.markMessagesAsRead(otherUserId, userId);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to mark messages as read" });
    }
  });
}
