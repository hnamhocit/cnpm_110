import { db } from "../db";

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.execute("SELECT 1");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}
