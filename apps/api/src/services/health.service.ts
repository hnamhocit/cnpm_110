
import { checkDatabaseConnection } from "../repositories/health.repository";

export async function getHealthStatus() {
  const isConnected = await checkDatabaseConnection();

  return {
    status: isConnected ? "ok" : "error",
    database: isConnected ? "connected" : "disconnected",
    httpStatus: isConnected ? 200 : 500,
  } as const;
}
