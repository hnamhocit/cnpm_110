import type { Role } from "../middlewares/auth";

export const systemRoles = ["Admin", "Organizer", "Judge", "Participant"] as const;
const signedIn = systemRoles;

// A grant can restrict an existing role; domain scope and actor boundaries still apply.
export const permissionRoles = {
  "users:read_all": ["Admin"],
  "users:create_internal": ["Admin"],
  "users:lock_unlock": ["Admin"],
  "users:read_own_profile": signedIn,
  "users:update_own_profile": signedIn,
  "users:change_password": signedIn,
  "contests:portal": ["Admin", "Organizer"],
  "contests:create": ["Organizer"],
  "contests:update": ["Organizer"],
  "contests:delete": ["Organizer"],
  "judging:read_scoreboard": ["Organizer"],
  "judging:read_assigned": ["Judge"],
  "judging:score": ["Judge"],
  "judging:lock": ["Judge"],
  "submissions:create": ["Participant"],
  "submissions:read_own": ["Participant"],
  "submissions:list": ["Organizer"],
  "submissions:moderate": ["Organizer"],
  "submissions:read_ai": ["Organizer", "Admin"],
  "portfolio:read_own": ["Participant"],
  "storage:upload": signedIn,
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof permissionRoles;
export const permissionNames = Object.keys(permissionRoles) as Permission[];

export function canGrant(role: Role, permission: Permission): boolean {
  return (permissionRoles[permission] as readonly Role[]).includes(role);
}
