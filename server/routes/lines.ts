import type { Express } from "express";
import { storage } from "../storage";

export function registerLineRoutes(app: Express) {
  // LINES
  app.get("/api/lines", async (req, res) => {
    try {
      const lines = await storage.listLines();
      res.json(lines);
    } catch (error: any) {
      res.status(500).json({ error: "Database not initialized", data: [] });
    }
  });

  app.get("/api/lines/:id", async (req, res) => {
    try {
      const line = await storage.getLine(Number(req.params.id));
      if (!line) return res.status(404).json({ error: "Line not found" });
      res.json(line);
    } catch (error: any) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/subsidiaries/:subsidiaryId/lines", async (req, res) => {
    try {
      const lines = await storage.listLinesBySubsidiary(Number(req.params.subsidiaryId));
      res.json(lines);
    } catch (error: any) {
      res.status(500).json({ error: "Database error", data: [] });
    }
  });

  app.post("/api/lines", async (req, res) => {
    try {
      // Ensure subsidiaryId is a number and remove undefined fields
      const lineData: any = {
        number: req.body.number,
        type: req.body.type,
        subsidiaryId: Number(req.body.subsidiaryId),
        location: req.body.location,
        status: req.body.status || 'working',
        inFaultFlow: req.body.inFaultFlow !== undefined ? req.body.inFaultFlow : true,
      };
      
      // Only include dates if provided, otherwise let defaults handle it
      if (req.body.establishmentDate) {
        lineData.establishmentDate = new Date(req.body.establishmentDate);
      }
      if (req.body.lastChecked) {
        lineData.lastChecked = new Date(req.body.lastChecked);
      }
      
      const line = await storage.createLine(lineData);
      res.json(line);
    } catch (error: any) {
      console.error("Error creating line:", error);
      res.status(500).json({ error: "Failed to create line", details: error.message });
    }
  });

  app.patch("/api/lines/:id", async (req, res) => {
    try {
      // Convert ISO string dates to Date objects for MySQL if provided
      const updateData: any = { ...req.body };
      if (updateData.lastChecked) {
        updateData.lastChecked = new Date(updateData.lastChecked);
      }
      if (updateData.establishmentDate) {
        updateData.establishmentDate = new Date(updateData.establishmentDate);
      }
      
      const line = await storage.updateLine(Number(req.params.id), updateData);
      res.json(line);
    } catch (error: any) {
      console.error("Error updating line:", error);
      res.status(500).json({ error: "Failed to update line", details: error.message });
    }
  });

  app.patch("/api/lines/:id/toggle-fault-flow", async (req, res) => {
    try {
      await storage.toggleLineInFaultFlow(Number(req.params.id));
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to toggle fault flow" });
    }
  });

  app.delete("/api/lines/:id", async (req, res) => {
    try {
      await storage.deleteLine(Number(req.params.id));
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete line" });
    }
  });
}
