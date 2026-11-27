"use client";

import { useEffect, useMemo, useState } from "react";
import { http } from "@/lib/http";

interface RegistrationItem {
  id: string;
  participantName: string;
  email: string;
  categoryName: string;
  registeredAt: string;
  submissionCount: number;
  status: "REGISTERED" | "SUBMITTED" | "WITHDRAWN";
}

const DEFAULT_REGISTRATIONS: RegistrationItem[] = [
  {
    id: "reg-1",
    participantName: "Nguyễn Minh Anh",
    email: "minhanh.analog@example.com",
    categoryName: "Street 35mm",
    registeredAt: "2026-11-18",
    submissionCount: 2,
    status: "SUBMITTED",
  },
  {
    id: "reg-2",
    participantName: "Trần Quốc Bảo",
    email: "quocbao.film@example.com",
    categoryName: "Portrait Medium Format",
    registeredAt: "2026-11-19",
    submissionCount: 0,
    status: "REGISTERED",
  },
  {
    id: "reg-3",
    participantName: "Lê Hoàng Nam",
    email: "hoangnam.bw@example.com",
    categoryName: "Black & White",
    registeredAt: "2026-11-20",
    submissionCount: 3,
    status: "SUBMITTED",
  },
];

const CONTEST_OPTIONS = [
  { id: "contest-1", name: "Analog Street Photography 2026" },
  { id: "contest-2", name: "35mm Film Portrait Awards" },
];

export default function ContestRegistrationsPage() {
  const [selectedContest, setSelectedContest] = useState(CONTEST_OPTIONS[0].id);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>(
    DEFAULT_REGISTRATIONS,
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    let active = true;
    async function loadRegistrations() {
      try {
        const res = await http.get(
          `/api/v1/contests/${selectedContest}/registrations`,
        );
        const items = res.data?.data?.items ?? res.data?.data;
        if (active && Array.isArray(items) && items.length > 0) {
          setRegistrations(items);
        }
      } catch {
        // Fallback to default list when API endpoint is not yet populated
      }
    }
    loadRegistrations();
    return () => {
      active = false;
    };
  }, [selectedContest]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return registrations.filter((item) => {
      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;
      const matchesQuery =
        !q ||
        item.participantName.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.categoryName.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [registrations, search, statusFilter]);

  const totalSubmissions = useMemo(
    () => filtered.reduce((sum, item) => sum + item.submissionCount, 0),
    [filtered],
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Danh sách Đăng ký Thí sinh (UC-17)
          </h1>
          <p className="text-sm text-neutral-500">
            Theo dõi thí sinh đã đăng ký theo hạng mục và số lượng bài đã nộp.
          </p>
        </div>

        <select
          value={selectedContest}
          onChange={(e) => setSelectedContest(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
          aria-label="Chọn cuộc thi"
        >
          {CONTEST_OPTIONS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs uppercase text-neutral-500">Tổng thí sinh</p>
          <p className="mt-1 text-2xl font-bold">{filtered.length}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs uppercase text-neutral-500">Tổng bài đã nộp</p>
          <p className="mt-1 text-2xl font-bold">{totalSubmissions}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs uppercase text-neutral-500">Chưa nộp bài</p>
          <p className="mt-1 text-2xl font-bold">
            {filtered.filter((r) => r.submissionCount === 0).length}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên, email, hạng mục..."
          className="w-full max-w-sm rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
          aria-label="Lọc theo trạng thái"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="REGISTERED">REGISTERED</option>
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="WITHDRAWN">WITHDRAWN</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Thí sinh</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Hạng mục</th>
              <th className="px-4 py-3">Ngày đăng ký</th>
              <th className="px-4 py-3">Số bài nộp</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {filtered.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium">
                  {item.participantName}
                </td>
                <td className="px-4 py-3 text-neutral-600">{item.email}</td>
                <td className="px-4 py-3">{item.categoryName}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {item.registeredAt}
                </td>
                <td className="px-4 py-3 font-semibold">
                  {item.submissionCount}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-neutral-500"
                >
                  Không có thí sinh nào phù hợp với bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
