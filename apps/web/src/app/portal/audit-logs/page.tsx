import AuditLogClient from "@/components/audit/audit-log-client";

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Nhật ký kiểm toán</h1>
        <p className="text-sm text-muted-foreground">UC-10 · Admin</p>
      </div>
      <AuditLogClient />
    </div>
  );
}
