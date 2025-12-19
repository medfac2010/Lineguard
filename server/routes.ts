import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerUserRoutes } from "./routes/users";
import { registerAuthRoutes } from "./routes/auth";
import { registerSubsidiaryRoutes } from "./routes/subsidiaries";
import { registerLineTypeRoutes } from "./routes/line-types";
import { registerLineRoutes } from "./routes/lines";
import { registerFaultRoutes } from "./routes/faults";
import { registerMessageRoutes } from "./routes/messages";
import { registerLineRequestRoutes } from "./routes/line-requests";
import { registerMaintenanceRoutes } from "./routes/maintenance";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register all routes
  registerUserRoutes(app);
  registerAuthRoutes(app);
  registerSubsidiaryRoutes(app);
  registerLineTypeRoutes(app);
  registerLineRoutes(app);
  registerFaultRoutes(app);
  registerMessageRoutes(app);
  registerLineRequestRoutes(app);
  registerMaintenanceRoutes(app);

  return httpServer;
}
