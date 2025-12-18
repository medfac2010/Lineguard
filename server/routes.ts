import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { hashPassword, comparePassword } from "./password";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // USERS
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.listUsers();
      // Remove passwords from response for security
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Database not initialized. Run 'npm run db:push && npx tsx server/seed.ts'" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(Number(req.params.id));
      if (!user) return res.status(404).json({ error: "User not found" });
      // Remove password from response for security
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      // Password will be hashed in storage.createUser
      const user = await storage.createUser(req.body);
      // Remove password from response for security
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      // Password will be hashed in storage.updateUser if provided
      const user = await storage.updateUser(Number(req.params.id), req.body);
      // Remove password from response for security
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user", details: error.message });
    }
  });

  app.patch("/api/users/:id/password", async (req, res) => {
    try {
      // Password will be hashed in storage.updateUserPassword
      await storage.updateUserPassword(Number(req.params.id), req.body.password);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      await storage.deleteUser(Number(req.params.id));
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // LOGIN endpoint for password verification
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { userId, password } = req.body;
      if (!userId || !password) {
        return res.status(400).json({ error: "User ID and password are required" });
      }

      const user = await storage.getUser(Number(userId));
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Compare provided password with hashed password
      const isValid = await comparePassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ success: true, user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Verify current password endpoint (for password change)
  app.post("/api/auth/verify-password", async (req, res) => {
    try {
      const { userId, password } = req.body;
      if (!userId || !password) {
        return res.status(400).json({ error: "User ID and password are required" });
      }

      const user = await storage.getUser(Number(userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Compare provided password with hashed password
      const isValid = await comparePassword(password, user.password);
      res.json({ valid: isValid });
    } catch (error: any) {
      res.status(500).json({ error: "Password verification failed" });
    }
  });

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

 /*  app.post("/api/faults", async (req, res) => {
    try {
      console.log('less')
      const fault = await storage.createFault(req.body);
      res.json(fault);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create fault" });
    }
  });
 */

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

  return httpServer;
}
