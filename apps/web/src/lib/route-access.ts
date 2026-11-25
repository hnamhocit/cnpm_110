export type Role = "Admin" | "Organizer" | "Judge" | "Participant";

const CANONICAL_ROLES: readonly Role[] = [
  "Admin",
  "Organizer",
  "Judge",
  "Participant",
];

// Giá trị role cũ từng xuất hiện trong token/dữ liệu seed trước đây.
const ROLE_ALIASES: Record<string, Role> = {
  administrator: "Admin",
  "contest organizer": "Organizer",
};

export function normalizeRole(role: string | null): Role | null {
  if (!role) return null;

  const key = role.trim().toLowerCase();
  const alias = ROLE_ALIASES[key];
  if (alias) return alias;

  return CANONICAL_ROLES.find((item) => item.toLowerCase() === key) ?? null;
}

// Portal quản lý dành cho Admin và Organizer; Judge có không gian chấm thi riêng.
export const PORTAL_ALLOWED_ROLES: readonly Role[] = ["Admin", "Organizer"];

// Kiểm tra một đường dẫn có thuộc Portal không.
export function isProtectedRoute(pathname: string): boolean {
  return pathname === "/portal" || pathname.startsWith("/portal/");
}

// Kiểm tra người dùng có Role được phép không.
export function hasRequiredRole(
  userRole: Role | string | null,
  allowedRoles: readonly Role[],
): boolean {
  const normalized = normalizeRole(userRole);
  return normalized !== null && allowedRoles.includes(normalized);
}

// Kiểm tra quyền truy cập Portal.
export function canAccessPortal(userRole: Role | string | null): boolean {
  return hasRequiredRole(userRole, PORTAL_ALLOWED_ROLES);
}

export type RouteDecision = "public" | "login" | "allow" | "forbidden";

export function getRouteDecision(
  pathname: string,
  userRole: Role | string | null,
): RouteDecision {
  if (!isProtectedRoute(pathname)) {
    return "public";
  }

  if (normalizeRole(userRole) === null) {
    return "login";
  }

  if (!canAccessPortal(userRole)) {
    return "forbidden";
  }

  return "allow";
}
