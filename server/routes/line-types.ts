import type { Express } from "express";
import { storage } from "../storage";

export function registerLineTypeRoutes(app: Express) {
  // LINE TYPES
  app.get("/api/line-types", async (req, res) => {
    try {
      const types = await storage.listLineTypes();
      res.json(types);
    } catch (error: any) {
      res.status(500).json({ error: "Database not initialized", data: [] });
    }
  });

  app.post("/api/line-types", async (req, res) => {
    try {
      const type = await storage.createLineType(req.body);
      res.json(type);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create line type" });
    }
  });

  app.patch("/api/line-types/:id", async (req, res) => {
    try {
      const type = await storage.updateLineType(Number(req.params.id), req.body.title);
      res.json(type);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update line type" });
    }
  });

  app.delete("/api/line-types/:id", async (req, res) => {
    try {
      await storage.deleteLineType(Number(req.params.id));
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete line type" });
    }
  });
}
