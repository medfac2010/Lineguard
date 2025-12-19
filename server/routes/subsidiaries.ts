import type { Express } from "express";
import { storage } from "../storage";

export function registerSubsidiaryRoutes(app: Express) {
  // SUBSIDIARIES
  app.get("/api/subsidiaries", async (req, res) => {
    try {
      const subs = await storage.listSubsidiaries();
      res.json(subs);
    } catch (error: any) {
      res.status(500).json({ error: "Database not initialized", data: [] });
    }
  });

  app.get("/api/subsidiaries/:id", async (req, res) => {
    try {
      const sub = await storage.getSubsidiary(Number(req.params.id));
      if (!sub) return res.status(404).json({ error: "Subsidiary not found" });
      res.json(sub);
    } catch (error: any) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/subsidiaries", async (req, res) => {
    try {
      const sub = await storage.createSubsidiary(req.body);
      res.json(sub);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create subsidiary" });
    }
  });

  app.patch("/api/subsidiaries/:id", async (req, res) => {
    try {
      const sub = await storage.updateSubsidiary(Number(req.params.id), req.body);
      res.json(sub);
    } catch (error: any) {
      console.error("Error updating subsidiary:", error);
      res.status(500).json({ error: "Failed to update subsidiary", details: error.message });
    }
  });

  app.delete("/api/subsidiaries/:id", async (req, res) => {
    try {
      await storage.deleteSubsidiary(Number(req.params.id));
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete subsidiary" });
    }
  });
}
