import { pool } from "./db";
import { deliverNotificationEmails } from "./services/notification-delivery";

try {
  console.log(await deliverNotificationEmails());
} finally {
  await pool.end();
}
