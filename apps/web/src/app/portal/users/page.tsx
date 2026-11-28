"use client";

import axios from "axios";
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Search,
  Shield,
  Unlock,
  UserPlus,
  Users,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { AuthField } from "@/components/auth/auth-field";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { http } from "@/lib/http";

const roles = {
  ADMIN: "Quản trị viên",
  ORGANIZER: "Ban tổ chức",
  JUDGE: "Giám khảo",
  PARTICIPANT: "Thí sinh",
};
type Role = keyof typeof roles;
const statuses = {
  ACTIVE: "Hoạt động",
  LOCKED: "Đã khóa",
  BANNED: "Đã cấm",
  PENDING_VERIFICATION: "Chờ xác thực",
};
type Account = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: { code: Role } | null;
  status: keyof typeof statuses;
};

function errorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (error.response?.status === 403)
      return "Chỉ quản trị viên có quyền thực hiện thao tác này.";
    if (error.response?.data?.message) return error.response.data.message;
  }
  return "Không thể thực hiện yêu cầu.";
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const actorId = useCurrentUser()?.id ?? "";
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState<{
    error: boolean;
    text: string;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const { data } = await http.get<{
          data: { items: Account[]; totalPages: number };
        }>("/api/v1/users", {
          params: { page, search },
          signal: controller.signal,
        });
        setAccounts(data.data.items);
        setTotalPages(data.data.totalPages);
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(errorMessage(error));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [page, search, revision]);

  const selected = accounts.find((account) => account.id === selectedId);

  async function save(
    event: FormEvent<HTMLFormElement>,
    action: "create" | "role" | "status",
  ) {
    event.preventDefault();
    if (saving) return;
    const element = event.currentTarget;
    const form = new FormData(element);
    setSaving(true);
    setMessage(null);
    try {
      if (action === "create") {
        const { data } = await http.post<{ data: { deliveryStatus: string } }>(
          "/api/v1/users",
          Object.fromEntries(form),
        );
        setMessage({
          error: false,
          text:
            data.data.deliveryStatus === "RETRY_REQUIRED"
              ? "Đã tạo tài khoản. Chủ tài khoản có thể yêu cầu gửi lại mã từ màn đăng nhập."
              : "Đã tạo tài khoản và gửi mã xác thực.",
        });
      } else if (selected) {
        const body =
          action === "role"
            ? { role: form.get("role") }
            : {
                status: selected.status === "LOCKED" ? "ACTIVE" : "LOCKED",
                reason: form.get("reason"),
              };
        await http.patch(`/api/v1/users/${selected.id}/${action}`, body);
        setMessage({
          error: false,
          text:
            action === "role"
              ? "Đã cập nhật vai trò."
              : "Đã cập nhật trạng thái.",
        });
      }
      element.reset();
      setRevision((value) => value + 1);
    } catch (error) {
      setMessage({ error: true, text: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  const statusVariant = (status: keyof typeof statuses) => {
    if (status === "ACTIVE") return "valid" as const;
    if (status === "PENDING_VERIFICATION") return "ai-warning" as const;
    return "disqualified" as const;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý tài khoản</h1>
        <p className="text-sm text-muted-foreground">
          Tìm kiếm, phân quyền, khóa/mở khóa và tạo tài khoản nội bộ.
        </p>
      </div>

      {loadError && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {message && (
        <div
          role={message.error ? "alert" : "status"}
          className={
            message.error
              ? "flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              : "flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
          }
        >
          {message.error ? (
            <AlertCircle className="size-4 shrink-0" />
          ) : (
            <CheckCircle2 className="size-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {!loadError && (
        <div className="grid gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-7">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="size-4 text-muted-foreground" />
                Tài khoản người dùng
              </CardTitle>
              <CardDescription>
                Chọn một tài khoản trong danh sách để chỉnh sửa vai trò hoặc
                trạng thái.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="flex flex-wrap items-end gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  setPage(1);
                  setSelectedId("");
                  setSearch(
                    String(
                      new FormData(event.currentTarget).get("search"),
                    ).trim(),
                  );
                }}
              >
                <div className="min-w-0 flex-1">
                  <AuthField
                    id="search"
                    label="Tìm theo tên hoặc email"
                    maxLength={255}
                  />
                </div>
                <Button type="submit" variant="outline" className="gap-1.5">
                  <Search className="size-4" />
                  Tìm
                </Button>
              </form>

              {loading ? (
                <p
                  role="status"
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Đang tải…
                </p>
              ) : accounts.length ? (
                <ul className="divide-y overflow-hidden rounded-lg border bg-background">
                  {accounts.map((account) => {
                    const isSelected = account.id === selectedId;
                    return (
                      <li key={account.id}>
                        <button
                          type="button"
                          className={`flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-muted/60 ${
                            isSelected
                              ? "bg-muted/80 ring-1 ring-inset ring-primary/30"
                              : ""
                          }`}
                          aria-pressed={isSelected}
                          onClick={() => {
                            setSelectedId(account.id);
                            setMessage(null);
                          }}
                        >
                          <Avatar className="size-9 border">
                            <AvatarFallback className="text-xs font-semibold">
                              {account.fullName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate font-medium">
                                {account.fullName}
                              </span>
                              <Badge variant="outline">
                                {account.role
                                  ? roles[account.role.code]
                                  : "Chưa có vai trò"}
                              </Badge>
                              <Badge variant={statusVariant(account.status)}>
                                {statuses[account.status]}
                              </Badge>
                            </div>
                            <span className="block truncate text-xs text-muted-foreground">
                              {account.email}
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                  Không tìm thấy tài khoản.
                </p>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">
                  Trang {page} / {Math.max(1, totalPages)}
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage(page - 1)}
                  >
                    Trang trước
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage(page + 1)}
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6 lg:col-span-5">
            {selected ? (
              <Card key={selected.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">
                        {selected.fullName}
                      </CardTitle>
                      <CardDescription className="break-all">
                        {selected.email}
                        {selected.phoneNumber
                          ? ` · ${selected.phoneNumber}`
                          : ""}
                      </CardDescription>
                    </div>
                    <Badge variant={statusVariant(selected.status)}>
                      {statuses[selected.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {actorId && selected.id !== actorId ? (
                    <>
                      <form
                        key={selected.role?.code}
                        className="space-y-3 rounded-lg border bg-muted/30 p-3.5"
                        onSubmit={(event) => void save(event, "role")}
                      >
                        <label className="grid gap-1.5 text-sm font-medium">
                          <span className="flex items-center gap-1.5">
                            <Shield className="size-3.5 text-muted-foreground" />
                            Vai trò
                          </span>
                          <select
                            name="role"
                            className="h-9 rounded-md border bg-background px-3 text-sm"
                            defaultValue={selected.role?.code ?? "PARTICIPANT"}
                          >
                            {Object.entries(roles).map(([code, label]) => (
                              <option key={code} value={code}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <Button type="submit" size="sm" disabled={saving}>
                          Lưu vai trò
                        </Button>
                      </form>

                      {selected.status !== "BANNED" && (
                        <form
                          className="space-y-3 rounded-lg border bg-muted/30 p-3.5"
                          onSubmit={(event) => void save(event, "status")}
                        >
                          <AuthField
                            id="reason"
                            label="Lý do (10–500 ký tự)"
                            minLength={10}
                            maxLength={500}
                            required
                          />
                          <Button
                            type="submit"
                            size="sm"
                            variant={
                              selected.status === "LOCKED"
                                ? "outline"
                                : "destructive"
                            }
                            className="gap-1.5"
                            disabled={saving}
                          >
                            {selected.status === "LOCKED" ? (
                              <>
                                <Unlock className="size-3.5" />
                                Mở khóa
                              </>
                            ) : (
                              <>
                                <Lock className="size-3.5" />
                                Khóa tài khoản
                              </>
                            )}
                          </Button>
                        </form>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Không thể tự thay đổi vai trò hoặc trạng thái của chính
                      bạn.
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Chọn một tài khoản bên trái để phân quyền hoặc khóa/mở khóa.
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserPlus className="size-4 text-muted-foreground" />
                  Tạo tài khoản nội bộ
                </CardTitle>
                <CardDescription>
                  Cấp tài khoản mới cho giám khảo, ban tổ chức hoặc quản trị
                  viên.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-4 sm:grid-cols-2"
                  onSubmit={(event) => void save(event, "create")}
                >
                  <AuthField
                    id="fullName"
                    label="Họ và tên"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                  <AuthField
                    id="email"
                    label="Email"
                    type="email"
                    maxLength={255}
                    required
                  />
                  <AuthField
                    id="temporaryPassword"
                    label="Mật khẩu tạm"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                  />
                  <label className="grid gap-2 text-sm font-medium">
                    Vai trò
                    <select
                      name="role"
                      className="h-9 rounded-md border bg-background px-3 text-sm"
                      defaultValue="JUDGE"
                    >
                      <option value="JUDGE">{roles.JUDGE}</option>
                      <option value="ORGANIZER">{roles.ORGANIZER}</option>
                      <option value="ADMIN">{roles.ADMIN}</option>
                    </select>
                  </label>
                  <div className="sm:col-span-2">
                    <Button type="submit" className="w-full" disabled={saving}>
                      Tạo tài khoản
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
