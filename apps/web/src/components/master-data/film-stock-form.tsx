"use client";

import { type FormEvent, useState } from "react";

import {
  CheckboxField,
  CheckboxGroup,
  Field,
  FormFooter,
  NumberField,
  SelectField,
  TextareaField,
  TextField,
} from "@/components/master-data/form-primitives";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildMasterDataCode } from "@/lib/master-data-format";
import { toOptions } from "@/lib/master-data-options";
import {
  type FieldErrors,
  validateFilmStock,
} from "@/lib/master-data-validation";
import {
  COLOR_TYPE_LABELS,
  COLOR_TYPES,
  type ColorType,
  FILM_FORMATS,
  FILM_PROCESSES,
  type FilmFormat,
  type FilmProcess,
  type FilmStock,
  type FilmStockInput,
  FORMAT_LABELS,
  PROCESS_LABELS,
} from "@/types/master-data";

type FormState = {
  brand: string;
  name: string;
  nominal_iso: string;
  process: FilmProcess;
  color_type: ColorType;
  supported_formats: FilmFormat[];
  is_dx_coded: boolean;
  description: string;
};

type FilmStockFormProps = {
  initial?: FilmStock | null;
  submitting: boolean;
  serverError?: string;
  onCancel: () => void;
  onSubmit: (input: FilmStockInput) => void | Promise<void>;
};

const processOptions = toOptions(FILM_PROCESSES, PROCESS_LABELS);
const colorOptions = toOptions(COLOR_TYPES, COLOR_TYPE_LABELS);
const formatOptions = toOptions(FILM_FORMATS, FORMAT_LABELS);

function toFormState(initial?: FilmStock | null): FormState {
  return {
    brand: initial?.brand ?? "",
    name: initial?.name ?? "",
    nominal_iso: initial ? String(initial.nominal_iso) : "",
    process: initial?.process ?? "C-41",
    color_type: initial?.color_type ?? "COLOR_NEGATIVE",
    supported_formats: initial?.supported_formats ?? ["135"],
    is_dx_coded: initial?.is_dx_coded ?? true,
    description: initial?.description ?? "",
  };
}

function toInput(values: FormState): FilmStockInput {
  const iso = values.nominal_iso.trim();
  return {
    brand: values.brand,
    name: values.name,
    nominal_iso: iso === "" ? Number.NaN : Number(iso),
    process: values.process,
    color_type: values.color_type,
    supported_formats: values.supported_formats,
    is_dx_coded: values.is_dx_coded,
    description: values.description.trim() || null,
  };
}

export function FilmStockForm({
  initial,
  submitting,
  serverError,
  onCancel,
  onSubmit,
}: FilmStockFormProps) {
  const [values, setValues] = useState<FormState>(() => toFormState(initial));
  const [errors, setErrors] = useState<FieldErrors>({});

  const isEditing = Boolean(initial);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function updateProcess(process: FilmProcess) {
    setValues((prev) => ({
      ...prev,
      process,
      color_type:
        process === "B&W"
          ? "BLACK_AND_WHITE"
          : process === "ECN-2"
            ? "MOTION_PICTURE_COLOR"
            : prev.color_type,
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.process;
      delete next.color_type;
      return next;
    });
  }

  function toggleFormat(format: string) {
    const current = values.supported_formats;
    const next = current.includes(format as FilmFormat)
      ? current.filter((item) => item !== format)
      : [...current, format as FilmFormat];
    update("supported_formats", next);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = toInput(values);
    const nextErrors = validateFilmStock(input);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await onSubmit(input);
  }

  const preview = buildMasterDataCode("film-stocks", {
    ...toInput(values),
    nominal_iso: Number(values.nominal_iso) || 0,
  });

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "Cập nhật Film Stock" : "Thêm Film Stock"}
        </DialogTitle>
        <DialogDescription>
          Danh mục phim chuẩn dùng cho logbook và nộp bài. Dữ liệu lịch sử được
          giữ nguyên khi ngừng lưu hành (BR-03).
        </DialogDescription>
      </DialogHeader>

      {serverError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {serverError}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="brand"
            label="Hãng phim"
            required
            maxLength={100}
            value={values.brand}
            error={errors.brand}
            hint="2–100 ký tự"
            onChange={(value) => update("brand", value)}
          />
          <TextField
            id="name"
            label="Tên dòng phim"
            required
            maxLength={150}
            value={values.name}
            error={errors.name}
            hint="VD: Portra 400, HP5 Plus"
            onChange={(value) => update("name", value)}
          />
          <NumberField
            id="nominal_iso"
            label="ISO danh định"
            required
            min={6}
            max={12800}
            step={1}
            value={values.nominal_iso}
            error={errors.nominal_iso}
            hint="Số nguyên 6–12800"
            onChange={(value) => update("nominal_iso", value)}
          />
          <SelectField
            id="process"
            label="Quy trình tráng"
            required
            value={values.process}
            options={processOptions}
            error={errors.process}
            onChange={(value) => updateProcess(value as FilmProcess)}
          />
          <SelectField
            id="color_type"
            label="Loại phim"
            required
            value={values.color_type}
            options={colorOptions}
            error={errors.color_type}
            onChange={(value) => update("color_type", value as ColorType)}
          />
          <div className="sm:col-span-2">
            <CheckboxGroup
              legend="Khổ phim hỗ trợ"
              required
              options={formatOptions}
              values={values.supported_formats}
              onToggle={toggleFormat}
              error={errors.supported_formats}
            />
          </div>
          <div className="sm:col-span-2">
            <CheckboxField
              id="is_dx_coded"
              label="Hỗ trợ DX Code"
              checked={values.is_dx_coded}
              description="Máy ảnh đọc tự động ISO từ mã vạch trên vỏ phim."
              onChange={(checked) => update("is_dx_coded", checked)}
            />
          </div>
          <div className="sm:col-span-2">
            <TextareaField
              id="description"
              label="Mô tả đặc tính"
              maxLength={2000}
              value={values.description}
              error={errors.description}
              hint="Tối đa 2000 ký tự"
              onChange={(value) => update("description", value)}
            />
          </div>
        </div>

        <Field
          id="code-preview"
          label="Mã dự kiến (CR-05)"
          hint="Mã chính thức do hệ thống sinh khi lưu."
        >
          <p className="rounded-lg border bg-muted/40 px-3 py-2 font-mono text-xs">
            {preview || "FILM-…"}
          </p>
        </Field>

        <FormFooter
          submitting={submitting}
          onCancel={onCancel}
          submitLabel={isEditing ? "Lưu thay đổi" : "Thêm Film Stock"}
        />
      </form>
    </DialogContent>
  );
}
