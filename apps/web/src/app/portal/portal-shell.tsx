"use client";

import {
  BarChart3,
  ChevronDown,
  ClipboardCheck,
  Database,
  Film,
  LayoutDashboard,
  ScrollText,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { http } from "@/lib/http";
import Header from "../components/portal/Header";

type MenuItem = {
  label: string;
  href: string;
  icon: typeof Sparkles;
  roles?: string[];
};

// Các mục điều hướng của Portal
const menuItems: MenuItem[] = [
  { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
  { label: "Reports", href: "/portal/reports", icon: BarChart3 },
  {
    label: "Cấu hình AI",
    href: "/portal/ai-settings",
    icon: Sparkles,
    roles: ["Admin", "Organizer"],
  },
];

const contestMenuItems: MenuItem[] = [
  { label: "Danh sách cuộc thi", href: "/portal/contests", icon: Trophy },
  { label: "Giám khảo", href: "/portal/contests/judges", icon: Users },
  { label: "Vòng chấm", href: "/portal/contests/rounds", icon: Database },
  {
    label: "Đăng ký tham gia",
    href: "/portal/contests/registrations",
    icon: Users,
  },
  {
    label: "Tiến độ chấm thi",
    href: "/portal/contests/judging-progress",
    icon: ClipboardCheck,
  },
];

// Master Data chỉ dành cho Administrator (BR-02).
const adminMenuItems: MenuItem[] = [
  { label: "Master Data", href: "/portal/master-data", icon: Database },
  {
    label: "Audit Log",
    href: "/portal/audit-logs",
    icon: ScrollText,
  },
];

// Kiểu dữ liệu cho Sidebar
type SidebarProps = {
  onClose?: () => void;
};

// Component Sidebar phong cách SaaS hiện đại đồng bộ theme
function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const [contestMenu, setContestMenu] = useState<{
    pathname: string;
    open: boolean;
  } | null>(null);
  const contestsOpen =
    contestMenu?.pathname === pathname
      ? contestMenu.open
      : pathname.startsWith("/portal/contests");
  const activeContestHref =
    contestMenuItems
      .slice(1)
      .find(
        (item) =>
          pathname === item.href || pathname.startsWith(`${item.href}/`),
      )?.href ??
    (pathname.startsWith("/portal/contests") ? "/portal/contests" : null);
  const user = useCurrentUser();
  const role = user?.role ?? null;
  const [submissionHref, setSubmissionHref] = useState("/portal/contests");
  useEffect(() => {
    if (user?.role !== "Organizer") return;
    let active = true;
    http
      .get<{ data?: { items?: { id: string }[] } }>("/api/v1/contests", {
        params: { page: 1, limit: 1, createdBy: user.id },
      })
      .then((response) => {
        const id = response.data.data?.items?.[0]?.id;
        if (active && id)
          setSubmissionHref(`/portal/contests/${id}/submissions`);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user?.id, user?.role]);

  const isAdmin = role === "Admin";
  const visibleItems = [
    ...menuItems.filter(
      (item) => !item.roles || item.roles.includes(role ?? ""),
    ),
    ...(isAdmin ? adminMenuItems : []),
  ];

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto bg-brand-ink px-4 py-6 text-white border-r border-slate-800">
      {/* LOGO */}
      <div className="mb-8 flex items-center justify-between gap-2 px-2">
        <Link
          href="/portal"
          onClick={onClose}
          className="flex items-center gap-2.5 font-bold tracking-tight text-white hover:opacity-90 transition-opacity"
        >
          <BrandMark size={36} className="rounded-lg" />
          <span className="text-base font-bold">CINEGEN</span>
        </Link>

        {/* Nút đóng Sidebar trên Mobile */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* NAVIGATION LINKS */}
      <nav aria-label="Portal Navigation" className="flex-1 space-y-1">
        {visibleItems.slice(0, 1).map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={onClose}
            aria-current={pathname === item.href ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium ${pathname === item.href ? "bg-brand-solid text-white" : "text-slate-300 hover:bg-slate-800/80"}`}
          >
            <LayoutDashboard className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
        <div>
          <button
            type="button"
            aria-expanded={contestsOpen}
            aria-controls="contest-navigation"
            onClick={() => setContestMenu({ pathname, open: !contestsOpen })}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white focus-visible:outline-2 focus-visible:outline-brand-ring"
          >
            <Trophy className="h-4 w-4" />
            <span className="flex-1 text-left">Cuộc thi</span>
            <ChevronDown
              className={`h-4 w-4 ${contestsOpen ? "rotate-180" : ""}`}
            />
          </button>
          <div
            id="contest-navigation"
            hidden={!contestsOpen}
            className="ml-5 mt-1 space-y-1 border-l border-slate-700 pl-3"
          >
            {[
              ...contestMenuItems,
              ...(role === "Organizer"
                ? [{ label: "Bài dự thi", href: submissionHref, icon: Film }]
                : []),
            ].map((item) => {
              const Icon = item.icon;
              const isSubmission =
                /\/portal\/contests\/[^/]+\/submissions(?:\/|$)/.test(pathname);
              const active =
                item.label === "Bài dự thi"
                  ? isSubmission
                  : activeContestHref === item.href && !isSubmission;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-brand-ring ${active ? "bg-brand-solid font-semibold text-white" : "text-slate-300 hover:bg-slate-800/80 hover:text-white"}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        {visibleItems.slice(1).map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-brand-solid font-semibold text-white shadow-sm shadow-brand-solid/25"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* FOOTER INFO */}
      <div className="mt-auto border-t border-slate-800/80 pt-4 px-2">
        <p className="text-xs text-slate-400 font-mono">
          Workspace v1.0 • CNPM
        </p>
      </div>
    </aside>
  );
}

// Kiểu dữ liệu cho Shell
type PortalShellProps = {
  children: ReactNode;
};

export default function PortalShell({ children }: PortalShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* SIDEBAR PC */}
      <div className="hidden lg:block lg:w-60 lg:shrink-0">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </div>

      {/* SIDEBAR MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng"
          className="fixed inset-0 z-50 flex lg:hidden"
        >
          <button
            type="button"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Đóng menu"
          />

          <div className="relative z-10 w-64 max-w-[80vw] shadow-2xl">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* HEADER */}
        <Header onMenuClick={() => setMobileOpen(true)} />

        {/* NỘI DUNG CHÍNH CỦA TRANG */}
        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
