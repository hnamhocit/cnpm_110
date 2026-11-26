"use client";

import { Archive, Pencil, RotateCcw, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatAperture,
  formatCameraSpecs,
  formatFilmSpecs,
  formatFocalLength,
  formatLocation,
} from "@/lib/master-data-format";
import {
  CAMERA_TYPE_LABELS,
  type Camera,
  COLOR_TYPE_LABELS,
  ENTITY_LABELS,
  type FilmLab,
  type FilmStock,
  FORMAT_LABELS,
  type Lens,
  type MasterDataEntity,
  type MasterDataRecord,
  type MasterDataStatus,
  PROCESS_LABELS,
  SCANNER_LABELS,
  STATUS_LABELS,
} from "@/types/master-data";

type Column = {
  key: string;
  label: string;
  render: (record: MasterDataRecord) => ReactNode;
};

type MasterDataTableProps = {
  entity: MasterDataEntity;
  items: MasterDataRecord[];
  canMutate: boolean;
  busyId: string | null;
  onEdit: (record: MasterDataRecord) => void;
  onDelete: (record: MasterDataRecord) => void;
  onToggleStatus: (record: MasterDataRecord) => void;
};

function statusBadge(status: MasterDataStatus) {
  const variant =
    status === "ACTIVE"
      ? "valid"
      : status === "DEPRECATED"
        ? "ai-warning"
        : "outline";
  return <Badge variant={variant}>{STATUS_LABELS[status]}</Badge>;
}

function nameCell(primary: string, code: string) {
  return (
    <div className="min-w-0">
      <p className="truncate font-medium">{primary}</p>
      <p className="truncate font-mono text-[11px] text-muted-foreground">
        {code}
      </p>
    </div>
  );
}

function buildColumns(entity: MasterDataEntity): Column[] {
  switch (entity) {
    case "film-stocks":
      return [
        {
          key: "brand",
          label: "Hãng / Dòng phim",
          render: (record) => {
            const stock = record as FilmStock;
            return nameCell(`${stock.brand} ${stock.name}`, stock.code);
          },
        },
        {
          key: "specs",
          label: "Thông số",
          render: (record) => {
            const stock = record as FilmStock;
            return (
              <div className="space-y-1">
                <Badge variant="outline">{formatFilmSpecs(stock)}</Badge>
                <p className="text-[11px] text-muted-foreground">
                  {COLOR_TYPE_LABELS[stock.color_type]}
                </p>
              </div>
            );
          },
        },
        {
          key: "formats",
          label: "Khổ phim",
          render: (record) =>
            (record as FilmStock).supported_formats
              .map((format) => FORMAT_LABELS[format])
              .join(", "),
        },
      ];
    case "cameras":
      return [
        {
          key: "model",
          label: "Hãng / Model",
          render: (record) => {
            const camera = record as Camera;
            return nameCell(`${camera.brand} ${camera.model}`, camera.code);
          },
        },
        {
          key: "specs",
          label: "Cơ chế",
          render: (record) => {
            const camera = record as Camera;
            return (
              <div className="space-y-1">
                <p>{CAMERA_TYPE_LABELS[camera.camera_type]}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatCameraSpecs(camera)}
                </p>
              </div>
            );
          },
        },
        {
          key: "mount",
          label: "Ngàm",
          render: (record) => {
            const camera = record as Camera;
            return camera.has_fixed_lens
              ? `Liền (${camera.fixed_lens_specs ?? "—"})`
              : (camera.default_lens_mount ?? "—");
          },
        },
      ];
    case "lenses":
      return [
        {
          key: "model",
          label: "Hãng / Model",
          render: (record) => {
            const lens = record as Lens;
            return nameCell(`${lens.brand} ${lens.model}`, lens.code);
          },
        },
        {
          key: "mount",
          label: "Ngàm",
          render: (record) => (record as Lens).mount_type,
        },
        {
          key: "optics",
          label: "Quang học",
          render: (record) => {
            const lens = record as Lens;
            return (
              <div className="space-y-1">
                <p>{formatFocalLength(lens)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatAperture(lens)} · {lens.is_prime ? "Prime" : "Zoom"}
                </p>
              </div>
            );
          },
        },
      ];
    case "film-labs":
      return [
        {
          key: "name",
          label: "Phòng Lab",
          render: (record) => {
            const lab = record as FilmLab;
            return nameCell(lab.name, lab.code);
          },
        },
        {
          key: "location",
          label: "Vị trí",
          render: (record) => formatLocation(record as FilmLab),
        },
        {
          key: "services",
          label: "Dịch vụ",
          render: (record) => {
            const lab = record as FilmLab;
            return (
              <div className="space-y-1">
                <p>
                  {lab.supported_processes
                    .map((p) => PROCESS_LABELS[p])
                    .join(", ")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {lab.scanners.map((s) => SCANNER_LABELS[s]).join(", ")}
                </p>
              </div>
            );
          },
        },
      ];
  }
}

function toggleLabel(status: MasterDataStatus): string {
  if (status === "ACTIVE") return "Ngừng lưu hành";
  if (status === "DEPRECATED") return "Kích hoạt lại";
  return "Kích hoạt";
}

export function MasterDataTable({
  entity,
  items,
  canMutate,
  busyId,
  onEdit,
  onDelete,
  onToggleStatus,
}: MasterDataTableProps) {
  const columns = buildColumns(entity);

  return (
    <Table>
      <caption className="sr-only">
        Danh mục {ENTITY_LABELS[entity].plural}
      </caption>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key}>{column.label}</TableHead>
          ))}
          <TableHead>Trạng thái</TableHead>
          {canMutate && <TableHead className="text-right">Hành động</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((record) => {
          const isBusy = busyId === record.id;
          return (
            <TableRow
              key={record.id}
              className={
                record.is_deleted ? "text-muted-foreground" : undefined
              }
            >
              {columns.map((column) => (
                <TableCell key={column.key}>{column.render(record)}</TableCell>
              ))}
              <TableCell>
                <div className="flex flex-wrap items-center gap-1.5">
                  {statusBadge(record.status)}
                  {record.is_deleted && (
                    <Badge variant="secondary">Đã lưu trữ</Badge>
                  )}
                </div>
              </TableCell>
              {canMutate && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Chỉnh sửa ${record.code}`}
                      title="Chỉnh sửa"
                      disabled={isBusy}
                      onClick={() => onEdit(record)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${toggleLabel(record.status)} ${record.code}`}
                      title={toggleLabel(record.status)}
                      disabled={isBusy}
                      onClick={() => onToggleStatus(record)}
                    >
                      {record.status === "DEPRECATED" ? (
                        <RotateCcw />
                      ) : (
                        <Archive />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Xóa mềm ${record.code}`}
                      title="Xóa mềm"
                      className="text-destructive hover:text-destructive"
                      disabled={isBusy}
                      onClick={() => onDelete(record)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
