// Kiểm tra người dùng có Role được phép không.
export function hasRequiredRole(
  userRole: Role | null,
  allowedRoles: readonly Role[]
): boolean {
  if (userRole === null) {
    return false;
  }

  // Chuyển đổi tất cả về chữ thường trước khi so sánh
  const normalizedUserRole = userRole.toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());

  return normalizedAllowedRoles.includes(normalizedUserRole);
}