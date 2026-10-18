export type Role = "Admin" | "Organizer" | "Judge" | "Participant";

// Những Role được phép truy cập Portal quản lý.
export const PORTAL_ALLOWED_ROLES: readonly Role[] = ["Admin", "Organizer"];

// Kiểm tra một đường dẫn có thuộc Portal không.
export function isProtectedRoute(pathname: string): boolean {
  return pathname === "/portal" || pathname.startsWith("/portal/");
}

// Kiểm tra người dùng có Role được phép không.
export function hasRequiredRole(
  userRole: Role | null,
  allowedRoles: readonly Role[],
): boolean {
  if (userRole === null) {
    return false;
  }

  const normalizedUserRole = userRole.toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map((role) => role.toLowerCase());
  return normalizedAllowedRoles.includes(normalizedUserRole);
}

// Kiểm tra quyền truy cập Portal.
export function canAccessPortal(userRole: Role | null): boolean {
  return hasRequiredRole(userRole, PORTAL_ALLOWED_ROLES);
}

export type RouteDecision = "public" | "login" | "allow" | "forbidden";

export function getRouteDecision(
  pathname: string,
  userRole: Role | null,
): RouteDecision {
  // Trang công khai thì không cần kiểm tra quyền
  if (!isProtectedRoute(pathname)) {
    return "public";
  }

  // Chưa đăng nhập
  if (userRole === null) {
    return "login";
  }

  // Đã đăng nhập: kiểm tra Role
  if (!canAccessPortal(userRole)) {
    return "forbidden";
  }

  return "allow";
}
