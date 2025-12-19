import type { Express } from "express";
import { storage } from "../storage";
import { comparePassword } from "../password";

export function registerAuthRoutes(app: Express) {
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
}
