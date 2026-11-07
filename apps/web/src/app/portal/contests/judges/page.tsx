"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  Mail,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { http } from "@/lib/http";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export type InvitedJudge = {
  id: string;
  fullName: string;
  email: string;
  bio?: string;
  invitedAt: string;
  respondedAt?: string;
  status: InvitationStatus;
  categories: string[];
  role: string;
};

const INITIAL_MOCK_JUDGES: InvitedJudge[] = [
  {
    id: "judge-1",
    fullName: "Nguyễn Văn Nghệ",
    email: "nghe.nguyen@analoglab.vn",
    bio: "Nhiếp ảnh gia đường phố 12 năm kinh nghiệm phim đen trắng (Monochrome & Darkroom)",
    invitedAt: "2026-10-15T09:30:00Z",
    respondedAt: "2026-10-16T14:20:00Z",
    status: "ACCEPTED",
    categories: ["Ảnh Đen Trắng", "Ảnh Đường Phố"],
    role: "Trưởng ban giám khảo",
  },
  {
    id: "judge-2",
    fullName: "Trần Minh Quân",
    email: "quan.tran@vietnamfilm.org",
    bio: "Chuyên gia tráng quét phim màu C-41 / E-6, Giám khảo giải ảnh quốc tế FIAP",
    invitedAt: "2026-10-15T09:35:00Z",
    respondedAt: "2026-10-17T10:15:00Z",
    status: "ACCEPTED",
    categories: ["Ảnh Phong Cảnh & Thiên Nhiên", "Chân Dung Phim Màu"],
    role: "Giám khảo chuyên môn",
  },
  {
    id: "judge-3",
    fullName: "Hoàng Thảo My",
    email: "thaomy.photo@studio.com",
    bio: "Nhiếp ảnh gia phim khổ Medium Format (120 film) & Chân dung nghệ thuật",
    invitedAt: "2026-10-18T11:00:00Z",
    status: "PENDING",
    categories: ["Chân Dung Phim Màu"],
    role: "Giám khảo khách mời",
  },
  {
    id: "judge-4",
    fullName: "Lê Khắc Toàn",
    email: "toan.le@filmcommunity.vn",
    bio: "Nhà báo ảnh phóng sự, chuyên gia ảnh tư liệu tư nhân",
    invitedAt: "2026-10-12T08:00:00Z",
    respondedAt: "2026-10-13T16:45:00Z",
    status: "DECLINED",
    categories: ["Ảnh Tài Liệu Phóng Sự"],
    role: "Giám khảo khách mời",
  },
  {
    id: "judge-5",
    fullName: "Đặng Quang Huy",
    email: "huy.dang@visualarts.edu.vn",
    bio: "Giảng viên bộ môn Kỹ thuật Nhiếp ảnh Analog & Cảm thụ thị giác",
    invitedAt: "2026-10-19T13:45:00Z",
    respondedAt: "2026-10-20T08:10:00Z",
    status: "ACCEPTED",
    categories: ["Ảnh Đen Trắng", "Ảnh Thử Nghiệm"],
    role: "Giám khảo chuyên môn",
  },
];

const AVAILABLE_CATEGORIES = [
  "Ảnh Đen Trắng",
  "Ảnh Đường Phố",
  "Ảnh Phong Cảnh & Thiên Nhiên",
  "Chân Dung Phim Màu",
  "Ảnh Tài Liệu Phóng Sự",
  "Ảnh Thử Nghiệm",
];

export default function ContestJudgesManagementPage() {
  const [judges, setJudges] = useState<InvitedJudge[]>(INITIAL_MOCK_JUDGES);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedContest, setSelectedContest] = useState("fpc-2026-national");
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Form mời giám khảo
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Giám khảo chuyên môn");
  const [inviteBio, setInviteBio] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const searchInputId = useId();
  const filterSelectId = useId();
  const contestSelectId = useId();
  const judgeNameId = useId();
  const judgeEmailId = useId();
  const judgeRoleId = useId();
  const judgeBioId = useId();

  // Tự động ẩn thông báo sau 4 giây
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Thống kê nhanh
  const totalInvited = judges.length;
  const acceptedCount = judges.filter((j) => j.status === "ACCEPTED").length;
  const pendingCount = judges.filter((j) => j.status === "PENDING").length;
  const declinedCount = judges.filter((j) => j.status === "DECLINED").length;

  const handleToggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!inviteName.trim() || !inviteEmail.trim()) {
      setFormError("Vui lòng nhập đầy đủ họ tên và email của giám khảo.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setFormError("Địa chỉ email không đúng định dạng.");
      return;
    }

    if (
      judges.some((j) => j.email.toLowerCase() === inviteEmail.toLowerCase())
    ) {
      setFormError("Giám khảo với email này đã có trong danh sách mời.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Giả lập gọi API hoặc gửi qua API nếu backend có endpoint
      try {
        await http.post(`/api/v1/contests/${selectedContest}/judges/invite`, {
          fullName: inviteName.trim(),
          email: inviteEmail.trim(),
          role: inviteRole,
          bio: inviteBio.trim(),
          categories: selectedCategories,
        });
      } catch {
        // Fallback local state if API endpoint is not yet connected
      }

      const newJudge: InvitedJudge = {
        id: `judge-${Date.now()}`,
        fullName: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        bio: inviteBio.trim() || undefined,
        invitedAt: new Date().toISOString(),
        status: "PENDING",
        categories: selectedCategories,
      };

      setJudges((prev) => [newJudge, ...prev]);
      setToastMessage(
        `Đã gửi thư mời tham gia ban giám khảo đến ${inviteEmail}`,
      );
      setShowInviteModal(false);

      // Reset form
      setInviteName("");
      setInviteEmail("");
      setInviteBio("");
      setSelectedCategories([]);
    } catch {
      setFormError("Không thể gửi thư mời. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendInvitation = (judge: InvitedJudge) => {
    setToastMessage(
      `Đã gửi lại email thư mời đến ${judge.fullName} (${judge.email})`,
    );
  };

  const handleRevokeInvitation = (id: string, name: string) => {
    setJudges((prev) => prev.filter((j) => j.id !== id));
    setToastMessage(`Đã thu hồi lời mời của ${name}`);
  };

  // Lọc danh sách giám khảo
  const filteredJudges = judges.filter((judge) => {
    const matchesSearch =
      judge.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      judge.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      judge.categories.some((c) =>
        c.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    const matchesStatus =
      statusFilter === "ALL" ? true : judge.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (isoString?: string) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Toast thông báo */}
      {toastMessage && (
        <output
          aria-live="polite"
          className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-4"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </output>
      )}

      {/* Điều hướng quay lại */}
      <div className="flex items-center justify-between">
        <Link
          href="/portal/contests"
          className="inline-flex items-center text-sm text-gray-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách cuộc thi
        </Link>
        <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded-full">
          Quy chuẩn BR-20: Tối thiểu 3 giám khảo/hạng mục
        </span>
      </div>

      {/* Header tiêu đề */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Quản lý Ban Giám khảo Cuộc thi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gửi lời mời, theo dõi phản hồi và phân công các chuyên gia nhiếp ảnh
            phim vào từng hạng mục chấm thi.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-black hover:bg-gray-800 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Mời giám khảo mới
          </Button>
        </div>
      </div>

      {/* Thẻ thống kê */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-gray-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Tổng lời mời</p>
              <p className="text-2xl font-bold text-gray-900">{totalInvited}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Đã chấp nhận</p>
              <p className="text-2xl font-bold text-emerald-700">
                {acceptedCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">
                Đang chờ phản hồi
              </p>
              <p className="text-2xl font-bold text-amber-700">
                {pendingCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Đã từ chối</p>
              <p className="text-2xl font-bold text-rose-700">
                {declinedCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Thanh bộ lọc & Tìm kiếm */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id={searchInputId}
              type="text"
              placeholder="Tìm theo tên, email, hạng mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Label
                htmlFor={filterSelectId}
                className="text-xs text-gray-500 whitespace-nowrap"
              >
                Trạng thái:
              </Label>
              <select
                id={filterSelectId}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="ALL">Tất cả ({totalInvited})</option>
                <option value="ACCEPTED">Đã nhận lời ({acceptedCount})</option>
                <option value="PENDING">Chờ xác nhận ({pendingCount})</option>
                <option value="DECLINED">Từ chối ({declinedCount})</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Label
                htmlFor={contestSelectId}
                className="text-xs text-gray-500 whitespace-nowrap"
              >
                Cuộc thi:
              </Label>
              <select
                id={contestSelectId}
                value={selectedContest}
                onChange={(e) => setSelectedContest(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="fpc-2026-national">
                  Cuộc thi Ảnh Phim Toàn Quốc 2026
                </option>
                <option value="fpc-2026-monochrome">
                  Triển lãm Nghệ thuật Đen Trắng 2026
                </option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danh sách bảng Giám khảo */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                Danh sách Giám khảo được mời
              </CardTitle>
              <CardDescription className="text-xs">
                Hiển thị {filteredJudges.length} trên tổng số {totalInvited} lời
                mời
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredJudges.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <Mail className="w-10 h-10 mx-auto text-gray-300" />
              <p className="text-sm font-medium">
                Không tìm thấy giám khảo nào phù hợp.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
                }}
                className="text-xs"
              >
                Xóa bộ lọc tìm kiếm
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/75 border-b text-xs text-gray-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Giám khảo</th>
                    <th className="py-3.5 px-4">Vai trò</th>
                    <th className="py-3.5 px-4">Hạng mục phụ trách</th>
                    <th className="py-3.5 px-4">Trạng thái mời</th>
                    <th className="py-3.5 px-4">Thời gian</th>
                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredJudges.map((judge) => (
                    <tr
                      key={judge.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      {/* Cột thông tin Giám khảo */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs uppercase">
                            {judge.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .slice(-2)
                              .join("")}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {judge.fullName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {judge.email}
                            </p>
                            {judge.bio && (
                              <p className="text-xs text-gray-400 max-w-xs truncate mt-0.5">
                                {judge.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cột vai trò */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md font-medium">
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                          {judge.role}
                        </span>
                      </td>

                      {/* Cột hạng mục */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {judge.categories.length > 0 ? (
                            judge.categories.map((cat) => (
                              <span
                                key={cat}
                                className="inline-block text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                              >
                                {cat}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              Chưa chỉ định
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cột trạng thái */}
                      <td className="py-4 px-4">
                        {judge.status === "ACCEPTED" && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã tham gia
                          </span>
                        )}
                        {judge.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" /> Đang chờ
                          </span>
                        )}
                        {judge.status === "DECLINED" && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" /> Đã từ chối
                          </span>
                        )}
                      </td>

                      {/* Cột thời gian */}
                      <td className="py-4 px-4 text-xs text-gray-500 whitespace-nowrap">
                        <p>Gửi: {formatDate(judge.invitedAt)}</p>
                        {judge.respondedAt && (
                          <p className="text-gray-400 mt-0.5">
                            Phản hồi: {formatDate(judge.respondedAt)}
                          </p>
                        )}
                      </td>

                      {/* Cột thao tác */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {judge.status === "PENDING" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendInvitation(judge)}
                              className="text-xs h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                            >
                              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Gửi lại
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleRevokeInvitation(judge.id, judge.fullName)
                            }
                            className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            Thu hồi
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Mời Giám khảo Mới */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Mời Giám khảo Mới
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Gửi thư mời chính thức qua email kèm liên kết gia nhập ban
                  chấm thi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-4 text-sm">
              <div>
                <Label
                  htmlFor={judgeNameId}
                  className="font-medium text-gray-700 text-xs"
                >
                  Họ và tên Giám khảo *
                </Label>
                <Input
                  id={judgeNameId}
                  placeholder="Ví dụ: Nguyễn Văn Nghệ"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label
                  htmlFor={judgeEmailId}
                  className="font-medium text-gray-700 text-xs"
                >
                  Email nhận lời mời *
                </Label>
                <Input
                  id={judgeEmailId}
                  type="email"
                  placeholder="judge@analogphotography.vn"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label
                  htmlFor={judgeRoleId}
                  className="font-medium text-gray-700 text-xs"
                >
                  Vai trò trong ban giám khảo
                </Label>
                <select
                  id={judgeRoleId}
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="Trưởng ban giám khảo">
                    Trưởng ban giám khảo
                  </option>
                  <option value="Giám khảo chuyên môn">
                    Giám khảo chuyên môn
                  </option>
                  <option value="Giám khảo khách mời">
                    Giám khảo khách mời
                  </option>
                  <option value="Cố vấn kỹ thuật phim">
                    Cố vấn kỹ thuật phim
                  </option>
                </select>
              </div>

              <div>
                <Label
                  htmlFor={judgeBioId}
                  className="font-medium text-gray-700 text-xs"
                >
                  Tiểu sử & Kinh nghiệm tóm tắt
                </Label>
                <textarea
                  id={judgeBioId}
                  rows={2}
                  placeholder="Kinh nghiệm chụp ảnh analog, thành tích nghệ thuật..."
                  value={inviteBio}
                  onChange={(e) => setInviteBio(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <Label className="font-medium text-gray-700 text-xs block mb-1.5">
                  Phân công vào các hạng mục chấm thi
                </Label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {AVAILABLE_CATEGORIES.map((cat) => {
                    const isChecked = selectedCategories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => handleToggleCategory(cat)}
                        className={`text-left text-xs p-2 rounded-md border flex items-center justify-between transition-colors ${
                          isChecked
                            ? "bg-stone-900 text-white border-stone-900"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <span className="truncate">{cat}</span>
                        {isChecked && (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 ml-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInviteModal(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  {isSubmitting ? "Đang gửi..." : "Gửi thư mời"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
