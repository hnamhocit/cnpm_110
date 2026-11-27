import { env } from "../../config/env";
import { seedRoles, seedUsers } from "./accounts";
import { seedOngoingContest, seedPublishedContest } from "./contests";
import { seedDemoSubmissions } from "./demo-submissions";

export async function seed() {
  if (env.nodeEnv === "production") {
    await seedRoles();
    return;
  }

  const database = new URL(env.databaseUrl);
  const isLocalDatabase = database && ["localhost", "127.0.0.1", "[::1]"].includes(database.hostname);
  if (isLocalDatabase && /^\/cinegen_acceptance_(?:test|verify(?:_[a-z0-9]+)?)$/.test(database.pathname)) {
    const { seedAcceptance } = await import("./acceptance");
    await seedAcceptance();
    return;
  }

  const roleMap = await seedRoles();
  const userIdsByRole = await seedUsers(roleMap);

  const organizerUserId = userIdsByRole.get("Organizer");
  const participantUserId = userIdsByRole.get("Participant");

  if (!organizerUserId || !participantUserId) {
    console.warn("Missing Organizer or Participant ID, skipping contest seed.");
    return;
  }

  await seedOngoingContest(organizerUserId, participantUserId);
  await seedPublishedContest(organizerUserId, participantUserId);
  if (isLocalDatabase) {
    console.log("");
    await seedDemoSubmissions();
    const { seedLifecycle } = await import("./lifecycle");
    console.log("");
    await seedLifecycle();
  }

  console.log("");
  console.log("[Seed] Mật khẩu chung lúc khởi tạo: password123");
  console.log(`[Seed] Dữ liệu mẫu: ${isLocalDatabase ? 6 : 2} cuộc thi.`);
}
