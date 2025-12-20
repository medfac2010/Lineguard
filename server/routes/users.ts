import type { Express } from "express";
import { storage } from "../storage";

export function registerUserRoutes(app: Express) {
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
      // Validate avatar size if provided (protect DB column limits)
      if (typeof req.body.avatar === 'string') {
        const byteLen = Buffer.byteLength(req.body.avatar, 'utf-8');
        const MAX_BYTES = 60 * 1024; // 60 KB
        if (byteLen > MAX_BYTES) {
          return res.status(400).json({ error: `Avatar data too large (${Math.round(byteLen/1024)}KB). Max is ${MAX_BYTES/1024}KB.` });
        }
      }

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
}
