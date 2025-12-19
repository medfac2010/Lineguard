import type { Express } from "express";
import { storage } from "../storage";

export function registerMaintenanceRoutes(app: Express) {
  // Get Fault Statistics
  app.get("/api/maintenance/stats", async (req, res) => {
    try {
      const faults = await storage.listFaults();
      const total = faults.length;
      const resolved = faults.filter(f => f.status === "resolved").length;
      const open = faults.filter(f => f.status === "open").length;
      const assigned = faults.filter(f => f.status === "assigned").length;

      // Calculate average resolution time
      let totalResolutionTime = 0;
      let resolvedCount = 0;
      faults.forEach(f => {
        if (f.resolvedAt && f.declaredAt) {
          totalResolutionTime += new Date(f.resolvedAt).getTime() - new Date(f.declaredAt).getTime();
          resolvedCount++;
        }
      });
      const avgResolutionTimeMs = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;
      
      res.json({
        total,
        resolved,
        open,
        assigned,
        avgResolutionTimeMs
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Declare Line Out of Service
  app.patch("/api/lines/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: "Status required" });

      const updated = await storage.updateLine(Number(req.params.id), { status });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update line status" });
    }
  });

  // Update Fault Feedback
  app.patch("/api/faults/:id/feedback", async (req, res) => {
    try {
      const { feedback } = req.body;
      if (typeof feedback !== "string") return res.status(400).json({ error: "Feedback required" });

      const updated = await storage.updateFault(Number(req.params.id), { feedback });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update feedback" });
    }
  });
}
