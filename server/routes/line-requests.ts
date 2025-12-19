import type { Express } from "express";
import { storage } from "../storage";
import { insertLineRequestSchema } from "@shared/schema";

export function registerLineRequestRoutes(app: Express) {
  // Middleware to ensure user is authenticated
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: "Unauthorized" });
  };

  // Middleware to ensure user is Admin
  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role === "admin") return next();
    res.status(403).json({ error: "Forbidden: Admin access required" });
  };

  // Middleware to ensure user is Maintenance
  const isMaintenance = (req: any, res: any, next: any) => {
    if (req.user?.role === "maintenance") return next();
    res.status(403).json({ error: "Forbidden: Maintenance access required" });
  };

  // List all requests (Admin & Maintenance)
  app.get("/api/line-requests", isAuthenticated, async (req: any, res) => {
    try {
      // Only Admin and Maintenance should see these
      if (req.user.role !== "admin" && req.user.role !== "maintenance") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const requests = await storage.listLineRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to list requests" });
    }
  });

  // Create Request (Admin only)
  app.post("/api/line-requests", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const parsed = insertLineRequestSchema.safeParse({ ...req.body, adminId: req.user.id });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error });
      }
      const request = await storage.createLineRequest(parsed.data);
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to create request" });
    }
  });

  // Approve Request (Maintenance only)
  app.post("/api/line-requests/:id/approve", isAuthenticated, isMaintenance, async (req, res) => {
    try {
      const requestId = Number(req.params.id);
      const requests = await storage.listLineRequests();
      const request = requests.find(r => r.id === requestId);

      if (!request) return res.status(404).json({ error: "Request not found" });
      if (request.status !== "pending") return res.status(400).json({ error: "Request already processed" });

      // Create the actual line
      const newLine = await storage.createLine({
        number: request.requestedNumber,
        type: "unknown", // Default or needs to be provided? Assuming default or 'unknown' for now unless extended schema
        subsidiaryId: request.subsidiaryId,
        location: "To be updated",
        establishmentDate: new Date(),
        status: "working",
        lastChecked: new Date(),
        inFaultFlow: true,
      });

      // Update request status
      const updated = await storage.updateLineRequestStatus(requestId, "approved");
      res.json({ request: updated, line: newLine });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to approve request" });
    }
  });

  // Reject Request (Maintenance only)
  app.post("/api/line-requests/:id/reject", isAuthenticated, isMaintenance, async (req, res) => {
    try {
      const { reason } = req.body;
      if (!reason) return res.status(400).json({ error: "Rejection reason required" });

      const updated = await storage.updateLineRequestStatus(Number(req.params.id), "rejected", reason);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject request" });
    }
  });

  // Delete Request (Admin only)
  app.delete("/api/line-requests/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteLineRequest(Number(req.params.id));
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete request" });
    }
  });
}
