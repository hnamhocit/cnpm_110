import { Film, Layers, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Báo cáo & Thống kê Cuộc thi (Analytics SCR-ORG-10)
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Thống kê xu hướng thiết bị analog, loại film stocks, phòng lab và tỷ
          lệ cảnh báo thẩm định AI.
        </p>
      </div>

      {/* Grid Báo Cáo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Film Stocks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Film className="w-4 h-4 text-amber-500" /> Top Loại Phim (Film
              Stocks)
            </CardTitle>
            <CardDescription className="text-xs">
              Các dòng phim được thí sinh sử dụng nhiều nhất
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-medium text-gray-800">
                Kodak Portra 400
              </span>
              <span className="font-bold text-gray-900">38%</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-medium text-gray-800">
                Ilford HP5 Plus 400
              </span>
              <span className="font-bold text-gray-900">26%</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-medium text-gray-800">
                Fujifilm Superia X-TRA
              </span>
              <span className="font-bold text-gray-900">18%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">Kodak Gold 200</span>
              <span className="font-bold text-gray-900">18%</span>
            </div>
          </CardContent>
        </Card>

        {/* Khổ phim */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" /> Khổ Phim (Film
              Formats)
            </CardTitle>
            <CardDescription className="text-xs">
              Phân bổ khổ phim nộp bài dự thi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-medium text-gray-800">
                35mm (135 format)
              </span>
              <span className="font-bold text-emerald-600">72%</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-medium text-gray-800">
                120 Medium Format (6x6)
              </span>
              <span className="font-bold text-blue-600">19%</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-medium text-gray-800">
                120 Medium Format (6x4.5)
              </span>
              <span className="font-bold text-purple-600">7%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">
                Large Format (4x5)
              </span>
              <span className="font-bold text-amber-600">2%</span>
            </div>
          </CardContent>
        </Card>

        {/* Thẩm định AI */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" /> Thẩm định AI & Âm
              bản
            </CardTitle>
            <CardDescription className="text-xs">
              Tỷ lệ quét tự động theo quy chuẩn BR-09 & BR-19
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-medium text-gray-800">
                Ảnh quang học sạch (Clean)
              </span>
              <span className="font-bold text-emerald-600">92.5%</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-medium text-gray-800">
                Cảnh báo nghi vấn AI
              </span>
              <span className="font-bold text-amber-600">5.5%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">
                Đối chứng âm bản thành công
              </span>
              <span className="font-bold text-blue-600">98.0%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
