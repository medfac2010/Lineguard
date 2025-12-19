import type { Express } from "express";
import { storage } from "../storage";

export function registerFaultRoutes(app: Express) {
  // FAULTS
  app.get("/api/faults", async (req, res) => {
    try {
      const faults = await storage.listFaults();
      res.json(faults);
    } catch (error: any) {
      res.status(500).json({ error: "Database not initialized", data: [] });
    }
  });

  app.get("/api/faults/:id", async (req, res) => {
    try {
      const fault = await storage.getFault(Number(req.params.id));
      if (!fault) return res.status(404).json({ error: "Fault not found" });
      res.json(fault);
    } catch (error: any) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/subsidiaries/:subsidiaryId/faults", async (req, res) => {
    try {
      const faults = await storage.listFaultsBySubsidiary(Number(req.params.subsidiaryId));
      res.json(faults);
    } catch (error: any) {
      res.status(500).json({ error: "Database error", data: [] });
    }
  });

  app.get("/api/lines/:lineId/faults", async (req, res) => {
    try {
      const faults = await storage.listFaultsByLine(Number(req.params.lineId));
      res.json(faults);
    } catch (error: any) {
      res.status(500).json({ error: "Database error", data: [] });
    }
  });

  app.post("/api/faults", async (req, res) => {
    try {
      const { lineId, subsidiaryId, declaredBy, symptoms, probableCause, declaredAt, status } = req.body;

      // Basic validation
      if (!lineId || !subsidiaryId || !declaredBy || !symptoms || !probableCause) {
        return res.status(400).json({ error: "Missing required fields: lineId, subsidiaryId, declaredBy, symptoms, probableCause" });
      }

      // Validate foreign keys exist
      const line = await storage.getLine(Number(lineId));
      if (!line) return res.status(400).json({ error: "Referenced line not found" });

      const sub = await storage.getSubsidiary(Number(subsidiaryId));
      if (!sub) return res.status(400).json({ error: "Referenced subsidiary not found" });

      const user = await storage.getUser(Number(declaredBy));
      if (!user) return res.status(400).json({ error: "Referenced user (declaredBy) not found" });

      const payload: any = {
        lineId: Number(lineId),
        subsidiaryId: Number(subsidiaryId),
        declaredBy: Number(declaredBy),
        symptoms: String(symptoms),
        probableCause: String(probableCause),
        status: status || "open",
        declaredAt: declaredAt ? new Date(declaredAt) : new Date(),
      };

      const fault = await storage.createFault(payload);
      res.json(fault);
    } catch (error: any) {
      console.error("Failed to create fault:", error);
      res.status(500).json({ error: "Failed to create fault", message: error?.message });
    }
  });

  app.patch("/api/faults/:id/assign", async (req, res) => {
    try {
      const fault = await storage.assignFault(Number(req.params.id), req.body.maintenanceUserId);
      res.json(fault);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to assign fault" });
    }
  });

  app.patch("/api/faults/:id/resolve", async (req, res) => {
    try {
      const fault = await storage.resolveFault(Number(req.params.id), req.body.feedback);
      res.json(fault);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to resolve fault" });
    }
  });

  app.patch("/api/faults/:id", async (req, res) => {
    try {
      const fault = await storage.updateFault(Number(req.params.id), req.body);
      res.json(fault);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update fault" });
    }
  });
}
