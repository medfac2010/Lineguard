import type { Express } from "express";
import { storage } from "../storage";
import { insertLineRequestSchema } from "@shared/schema";

export function registerLineRequestRoutes(app: Express) {
  // List all requests
  app.get("/api/line-requests", async (req: any, res) => {
    try {
      const requests = await storage.listLineRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to list requests" });
    }
  });

  // Create Request
  app.post("/api/line-requests", async (req: any, res) => {
    try {
      const parsed = insertLineRequestSchema.safeParse({ ...req.body });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error });
      }
      const request = await storage.createLineRequest(parsed.data);
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to create request" });
    }
  });

  // Approve Request
  app.post("/api/line-requests/:id/approve", async (req, res) => {
    try {
      const requestId = Number(req.params.id);
      const { assignedNumber } = req.body;

      if (!assignedNumber) {
        return res.status(400).json({ error: "Assigned number is required for approval" });
      }

      const request = await storage.getLineRequest(requestId);

      if (!request) return res.status(404).json({ error: "Request not found" });
      if (request.status !== "pending") return res.status(400).json({ error: "Request already processed" });

      // Create the actual line
      const newLine = await storage.createLine({
        number: assignedNumber,
        type: request.requestedType,
        subsidiaryId: request.subsidiaryId,
        location: "To be updated",
        establishmentDate: new Date(),
        status: "working",
        lastChecked: new Date(),
        inFaultFlow: true,
      });

      // Update request status
      const updated = await storage.updateLineRequestStatus(requestId, "approved", undefined, assignedNumber);
      res.json({ request: updated, line: newLine });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to approve request" });
    }
  });

  // Reject Request
  app.post("/api/line-requests/:id/reject", async (req, res) => {
    try {
      const { reason } = req.body;
      if (!reason) return res.status(400).json({ error: "Rejection reason required" });

      const updated = await storage.updateLineRequestStatus(Number(req.params.id), "rejected", reason);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject request" });
    }
  });

  // Delete Request
  app.delete("/api/line-requests/:id", async (req, res) => {
    try {
      await storage.deleteLineRequest(Number(req.params.id));
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete request" });
    }
  });
}
