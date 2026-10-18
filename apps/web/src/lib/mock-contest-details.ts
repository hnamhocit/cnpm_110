import type { Contest } from "@/types/contest";

export const DETAILED_CONTESTS: Record<string, Contest> = {
  "contest-1": {
    id: "contest-1",
    name: "Khoảnh khắc Phố thị — Sài Gòn & Hà Nội 2026",
    description:
      "Tôn vinh nhịp sống đường phố Việt Nam qua chất ảnh phim hạt mịn. Chấp nhận các định dạng phim 35mm và 120 (Medium Format), màu hoặc trắng đen.",
    start_at: "2026-10-01T00:00:00Z",
    end_at: "2026-11-30T23:59:59Z",
    status: "ongoing",
    category: "Street / 35mm & 120",
    prize: "65.000.000 VNĐ",
    rules: [
      "Ảnh dự thi bắt buộc phải được chụp bằng máy ảnh quang học dùng phim (35mm hoặc 120). Không chấp nhận ảnh chụp bằng máy ảnh kỹ thuật số giả lập màu phim.",
      "Thí sinh phải nộp file scan chất lượng cao (tối thiểu 3000px cạnh dài) từ cuộn phim gốc.",
      "Mỗi thí sinh được gửi tối đa 5 tác phẩm đơn hoặc 1 bộ ảnh phóng sự (tối đa 8 ảnh).",
      "Chỉ chấp nhận chỉnh sửa cơ bản (cân chỉnh sáng tối, crop không quá 10%), không được can thiệp xóa vật thể hoặc ghép ảnh kỹ thuật số.",
      "Tác phẩm sẽ được quét qua mô hình AI để xác thực độ nguyên bản của hạt phim (grain) và kiểm tra trùng lặp.",
    ],
    film_requirements: {
      formats: ["35mm (135)", "120 Medium Format"],
      types: [
        "Color Negative (C-41)",
        "Black & White (B&W)",
        "Cine Film (ECN-2)",
      ],
      max_photos_per_submission: 5,
      allow_digital_editing: false,
    },
    judges: [
      {
        id: "judge-1",
        name: "Nguyễn Hải Long",
        role: "Trưởng Ban Giám Khảo",
        bio: "Nhiếp ảnh gia tư liệu đường phố với 15 năm gắn bó với máy cơ cơ khí và phim quang học.",
      },
      {
        id: "judge-2",
        name: "Trần Mai Phương",
        role: "Giám khảo Chuyên môn",
        bio: "Nghệ sĩ thị giác, chuyên gia phục dựng phòng tối và tráng rọi thủ công tại Lab Họa Phim.",
      },
      {
        id: "judge-3",
        name: "Lê Quốc Dũng",
        role: "Giám khảo Kỹ thuật & AI",
        bio: "Chuyên gia phân tích quang học và xử lý ảnh số, đại diện hội đồng thẩm định AI.",
      },
    ],
    prizes: [
      {
        id: "prize-1",
        rank: "Giải Nhất (Grand Prize)",
        name: "Khoảnh khắc Vàng Phố Thị",
        reward:
          "30.000.000 VNĐ + Thân máy ảnh Leica M6 + 20 cuộn phim Kodak Portra 400",
        description:
          "Dành cho tác phẩm xuất sắc nhất toàn diện về bố cục, ánh sáng và câu chuyện phố thị.",
      },
      {
        id: "prize-2",
        rank: "Giải Nhì",
        name: "Nhịp Thở Đô Thị",
        reward:
          "15.000.000 VNĐ + 10 cuộn phim CineStill 800T + Voucher tráng scan 1 năm",
        description:
          "Tác phẩm thể hiện cảm xúc chân thực và sắc màu đặc trưng của con người Việt Nam.",
      },
      {
        id: "prize-3",
        rank: "Giải Ba",
        name: "Ánh Sáng Ven Đường",
        reward: "10.000.000 VNĐ + 5 cuộn phim Kodak Tri-X 400",
        description:
          "Tác phẩm có kỹ thuật phơi sáng và bắt khoảnh khắc xuất sắc.",
      },
      {
        id: "prize-4",
        rank: "Giải Khán Giả Bình Chọn",
        name: "Góc Nhìn Cộng Đồng",
        reward: "10.000.000 VNĐ + Kỷ niệm chương pha lê",
        description:
          "Dành cho tác phẩm nhận được lượt bình chọn cao nhất trên nền tảng.",
      },
    ],
    criteria: [
      {
        id: "crit-1",
        name: "Bố cục & Khoảnh khắc",
        weight: 35,
        description:
          "Độ đắt giá của thời điểm bấm máy, tỷ lệ khung hình và tính sáng tạo trong góc nhìn.",
      },
      {
        id: "crit-2",
        name: "Kỹ thuật Phơi sáng & Màu sắc",
        weight: 25,
        description:
          "Làm chủ vùng sáng/tối, độ sâu trường ảnh và chất lượng hạt phim đặc trưng.",
      },
      {
        id: "crit-3",
        name: "Câu chuyện & Cảm xúc",
        weight: 25,
        description:
          "Thông điệp nhân văn, tính chân thật và hơi thở cuộc sống truyền tải qua bức ảnh.",
      },
      {
        id: "crit-4",
        name: "Tính Nguyên bản (AI & Lab Check)",
        weight: 15,
        description:
          "Độ tin cậy của thông số máy/phim và sự thuần khiết quang học không can thiệp số.",
      },
    ],
  },
  "contest-2": {
    id: "contest-2",
    name: "Black & White Masters — Đơn sắc Đương đại",
    description:
      "Cuộc thi dành riêng cho tín đồ phim đen trắng (Tri-X, Ilford HP5, Kentmere). Tập trung vào nghệ thuật tương phản ánh sáng và bố cục hình khối.",
    start_at: "2026-10-15T00:00:00Z",
    end_at: "2026-12-15T23:59:59Z",
    status: "ongoing",
    category: "B&W Film Only",
    prize: "45.000.000 VNĐ",
    rules: [
      "Chỉ chấp nhận các tác phẩm chụp trên phim đen trắng truyền thống (Silver Halide B&W).",
      "Khuyến khích các kỹ thuật tráng đẩy sáng (push process) thể hiện độ tương phản cao.",
      "Tối đa 6 ảnh đơn cho mỗi thí sinh tham gia.",
    ],
    film_requirements: {
      formats: ["35mm", "120", "Large Format 4x5"],
      types: ["Black & White (B&W Pan / Ortho)"],
      max_photos_per_submission: 6,
      allow_digital_editing: false,
    },
    judges: [
      {
        id: "judge-bw-1",
        name: "Phạm Bá Lộc",
        role: "Trưởng Ban Giám Khảo",
        bio: "Nghệ sĩ nhiếp ảnh đen trắng với hơn 20 năm thực hành tráng rọi phòng tối cổ điển.",
      },
      {
        id: "judge-bw-2",
        name: "Hoàng Minh Trí",
        role: "Giám khảo Khối & Tương phản",
        bio: "Giảng viên mỹ thuật và giám tuyển ảnh tư liệu đương đại.",
      },
    ],
    prizes: [
      {
        id: "prize-bw-1",
        rank: "Giải Nhất",
        name: "Đơn Sắc Tuyệt Hảo",
        reward:
          "25.000.000 VNĐ + Máy ảnh Hasselblad 500C/M + 15 cuộn Ilford HP5+",
        description:
          "Tác phẩm thể hiện nghệ thuật ánh sáng và tương phản đơn sắc xuất sắc nhất.",
      },
      {
        id: "prize-bw-2",
        rank: "Giải Nhì",
        name: "Bóng Đổ Nghệ Thuật",
        reward: "12.000.000 VNĐ + 10 cuộn phim Kodak Tri-X",
        description: "Sử dụng độ tương phản mạnh mẽ và hình khối ấn tượng.",
      },
      {
        id: "prize-bw-3",
        rank: "Giải Ba",
        name: "Sắc Xám Tinh Tế",
        reward: "8.000.000 VNĐ + Bộ hóa chất tráng phim tại nhà",
        description: "Dải chuyển sắc xám mịn màng và độ chi tiết cao.",
      },
    ],
    criteria: [
      {
        id: "crit-bw-1",
        name: "Tương phản & Dải sắc xám",
        weight: 40,
        description:
          "Khả năng làm chủ vùng đen sâu (shadows) và vùng sáng trong trẻo (highlights).",
      },
      {
        id: "crit-bw-2",
        name: "Bố cục & Hình khối",
        weight: 35,
        description:
          "Tận dụng các đường nét hình học, nhịp điệu ánh sáng trong khung cảnh.",
      },
      {
        id: "crit-bw-3",
        name: "Tính Nguyên bản",
        weight: 25,
        description:
          "Độ chân thực của cuộn phim đen trắng gốc không giả lập số.",
      },
    ],
  },
};
