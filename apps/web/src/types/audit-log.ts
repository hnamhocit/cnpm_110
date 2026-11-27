export type AuditLogEntry = {
  id: string;
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string | null;
  ipAddress?: string | null;
  createdAt: string;
};

export type AuditLogQuery = {
  actorId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  search?: string;
  from?: string;
  to?: string;
  page: number;
  limit: number;
};

export type AuditLogPage = {
  items: AuditLogEntry[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
