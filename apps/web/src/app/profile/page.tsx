"use client";

import axios from "axios";
import { ArrowLeft, CheckCircle2, AlertCircle, Lock, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { AuthField } from "@/components/auth/auth-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { http } from "@/lib/http";
import { logout } from "@/lib/logout";

type Profile = {
  fullName: string;
  email: string;
  avatarUrl: string | null;
  profile: { displayName?: string; bio?: string };
};

export default function ProfilePage() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState("");
  const [activeForm, setActiveForm] = useState<"profile" | "password" | null>(null);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    http.get<{ data: { user: Profile } }>("/api/v1/users/me", { signal: controller.signal })
      .then(({ data }) => setUser(data.data.user))
      .catch(() => {
        if (!controller.signal.aborted) setLoadError("Không thể tải hồ sơ. Vui lòng đăng nhập lại.");
      });
    return () => controller.abort();
  }, []);

  async function save(event: FormEvent<HTMLFormElement>, action: "profile" | "password") {
    event.preventDefault();
    if (activeForm) return;
    const form = new FormData(event.currentTarget);
    setMessage(null);
    if (action === "password" && form.get("newPassword") !== form.get("confirmPassword")) {
      setMessage({ error: true, text: "Mật khẩu xác nhận không khớp." });
      return;
    }
    setActiveForm(action);
    try {
      if (action === "profile") {
        await http.put("/api/v1/users/me/profile", {
          fullName: form.get("fullName"),
          displayName: form.get("displayName"),
          bio: form.get("bio"),
          avatarUrl: String(form.get("avatarUrl")).trim() || null,
        });
        setMessage({ error: false, text: "Đã lưu hồ sơ." });
      } else {
        await http.patch("/api/v1/users/me/password", {
          currentPassword: form.get("currentPassword"),
          newPassword: form.get("newPassword"),
        });
        await logout();
        window.location.replace("/login");
      }
    } catch (error) {
      const detail = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message : undefined;
      setMessage({ error: true, text: detail ?? "Không thể lưu thay đổi." });
    } finally {
      setActiveForm(null);
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Về trang chủ
        </Link>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
            <p className="text-sm text-muted-foreground">
              Quản lý thông tin hiển thị và bảo mật tài khoản của bạn.
            </p>
          </div>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>
            {loadError}{" "}
            <Link href="/login" className="font-semibold underline underline-offset-4">
              Đăng nhập
            </Link>
          </span>
        </div>
      )}

      {!user && !loadError && (
        <div
          role="status"
          className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground"
        >
          Đang tải hồ sơ…
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

      {user && (
        <div className="space-y-6">
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <Avatar className="size-16 border">
                {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.fullName} /> : null}
                <AvatarFallback className="text-lg font-semibold">
                  {(user.profile.displayName || user.fullName || "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold">
                  {user.profile.displayName || user.fullName}
                </p>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-7">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserIcon className="size-4 text-muted-foreground" />
                  Thông tin cá nhân
                </CardTitle>
                <CardDescription>
                  Cập nhật họ tên, tên hiển thị, tiểu sử và ảnh đại diện.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={(event) => void save(event, "profile")}>
                  <AuthField id="email" label="Email" defaultValue={user.email} readOnly />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <AuthField
                      id="fullName"
                      label="Họ và tên"
                      defaultValue={user.fullName}
                      maxLength={100}
                      required
                    />
                    <AuthField
                      id="displayName"
                      label="Tên hiển thị"
                      defaultValue={user.profile.displayName}
                      maxLength={100}
                    />
                  </div>
                  <AuthField
                    id="bio"
                    label="Tiểu sử"
                    defaultValue={user.profile.bio}
                    maxLength={1000}
                  />
                  <AuthField
                    id="avatarUrl"
                    label="Đường dẫn ảnh đại diện (HTTPS)"
                    type="url"
                    defaultValue={user.avatarUrl ?? ""}
                    maxLength={255}
                  />
                  <div className="pt-2">
                    <Button type="submit" disabled={activeForm !== null}>
                      Lưu hồ sơ
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lock className="size-4 text-muted-foreground" />
                  Đổi mật khẩu
                </CardTitle>
                <CardDescription>
                  Sau khi đổi mật khẩu, bạn sẽ được đăng xuất để đăng nhập lại.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={(event) => void save(event, "password")}>
                  <AuthField
                    id="currentPassword"
                    label="Mật khẩu hiện tại"
                    type="password"
                    autoComplete="current-password"
                    maxLength={128}
                    required
                  />
                  <AuthField
                    id="newPassword"
                    label="Mật khẩu mới"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                  />
                  <AuthField
                    id="confirmPassword"
                    label="Xác nhận mật khẩu mới"
                    type="password"
                    autoComplete="new-password"
                    required
                  />
                  <div className="pt-2">
                    <Button type="submit" variant="secondary" className="w-full" disabled={activeForm !== null}>
                      Đổi mật khẩu
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}
