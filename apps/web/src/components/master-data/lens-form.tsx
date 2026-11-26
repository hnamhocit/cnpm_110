"use client";

import { type FormEvent, useState } from "react";

import {
  CheckboxField,
  CheckboxGroup,
  Field,
  FormFooter,
  NumberField,
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
import { type FieldErrors, validateLens } from "@/lib/master-data-validation";
import {
  FILM_FORMATS,
  type FilmFormat,
  FORMAT_LABELS,
  type Lens,
  type LensInput,
} from "@/types/master-data";

type FormState = {
  brand: string;
  model: string;
  mount_type: string;
  focal_length_min_mm: string;
  focal_length_max_mm: string;
  is_prime: boolean;
  max_aperture: string;
  min_aperture: string;
  format_coverage: FilmFormat[];
};

type LensFormProps = {
  initial?: Lens | null;
  submitting: boolean;
  serverError?: string;
  onCancel: () => void;
  onSubmit: (input: LensInput) => void | Promise<void>;
};

const formatOptions = toOptions(FILM_FORMATS, FORMAT_LABELS);

function toFormState(initial?: Lens | null): FormState {
  return {
    brand: initial?.brand ?? "",
    model: initial?.model ?? "",
    mount_type: initial?.mount_type ?? "",
    focal_length_min_mm: initial ? String(initial.focal_length_min_mm) : "",
    focal_length_max_mm:
      initial?.focal_length_max_mm !== null &&
      initial?.focal_length_max_mm !== undefined
        ? String(initial.focal_length_max_mm)
        : "",
    is_prime: initial?.is_prime ?? true,
    max_aperture: initial ? String(initial.max_aperture) : "",
    min_aperture:
      initial?.min_aperture !== null && initial?.min_aperture !== undefined
        ? String(initial.min_aperture)
        : "",
    format_coverage: initial?.format_coverage ?? ["135"],
  };
}

function parseRequired(value: string): number {
  const text = value.trim();
  return text === "" ? Number.NaN : Number(text);
}

function parseOptional(value: string): number | null {
  const text = value.trim();
  return text === "" ? null : Number(text);
}

function toInput(values: FormState): LensInput {
  return {
    brand: values.brand,
    model: values.model,
    mount_type: values.mount_type,
    focal_length_min_mm: parseRequired(values.focal_length_min_mm),
    focal_length_max_mm: values.is_prime
      ? null
      : parseOptional(values.focal_length_max_mm),
    is_prime: values.is_prime,
    max_aperture: parseRequired(values.max_aperture),
    min_aperture: parseOptional(values.min_aperture),
    format_coverage: values.format_coverage,
  };
}

export function LensForm({
  initial,
  submitting,
  serverError,
  onCancel,
  onSubmit,
}: LensFormProps) {
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

  function updatePrime(isPrime: boolean) {
    setValues((prev) => ({
      ...prev,
      is_prime: isPrime,
      focal_length_max_mm: isPrime ? "" : prev.focal_length_max_mm,
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.focal_length_max_mm;
      return next;
    });
  }

  function toggleFormat(format: string) {
    const next = values.format_coverage.includes(format as FilmFormat)
      ? values.format_coverage.filter((item) => item !== format)
      : [...values.format_coverage, format as FilmFormat];
    update("format_coverage", next);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = toInput(values);
    const nextErrors = validateLens(input);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await onSubmit(input);
  }

  const preview = buildMasterDataCode("lenses", {
    ...toInput(values),
    focal_length_min_mm: parseOptional(values.focal_length_min_mm) ?? 0,
  });

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "Cập nhật ống kính" : "Thêm ống kính"}
        </DialogTitle>
        <DialogDescription>
          Thông số quang học dùng để đối chiếu metadata ảnh phim (BR-22).
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
            label="Thương hiệu"
            required
            maxLength={100}
            value={values.brand}
            error={errors.brand}
            onChange={(value) => update("brand", value)}
          />
          <TextField
            id="model"
            label="Model"
            required
            maxLength={150}
            value={values.model}
            error={errors.model}
            hint="VD: Summicron-M 35mm f/2 ASPH"
            onChange={(value) => update("model", value)}
          />
          <TextField
            id="mount_type"
            label="Loại ngàm"
            required
            maxLength={50}
            value={values.mount_type}
            error={errors.mount_type}
            hint="VD: Leica M, Nikon F, M42"
            onChange={(value) => update("mount_type", value)}
          />
          <div className="flex items-end">
            <CheckboxField
              id="is_prime"
              label="Ống kính Prime (một tiêu cự)"
              checked={values.is_prime}
              description="Bỏ chọn nếu là ống kính Zoom."
              onChange={updatePrime}
            />
          </div>
          <NumberField
            id="focal_length_min_mm"
            label={values.is_prime ? "Tiêu cự (mm)" : "Tiêu cự nhỏ nhất (mm)"}
            required
            min={4}
            max={2000}
            value={values.focal_length_min_mm}
            error={errors.focal_length_min_mm}
            onChange={(value) => update("focal_length_min_mm", value)}
          />
          <NumberField
            id="focal_length_max_mm"
            label="Tiêu cự lớn nhất (mm)"
            required={!values.is_prime}
            min={4}
            max={2000}
            value={values.focal_length_max_mm}
            error={errors.focal_length_max_mm}
            hint={
              values.is_prime
                ? "Prime không cần nhập tiêu cự lớn nhất."
                : "Phải lớn hơn tiêu cự nhỏ nhất."
            }
            disabled={values.is_prime}
            onChange={(value) => update("focal_length_max_mm", value)}
          />
          <NumberField
            id="max_aperture"
            label="Khẩu độ tối đa (f/)"
            required
            min={0.7}
            max={32}
            value={values.max_aperture}
            error={errors.max_aperture}
            hint="VD: 1.4, 2, 2.8"
            onChange={(value) => update("max_aperture", value)}
          />
          <NumberField
            id="min_aperture"
            label="Khẩu độ khép nhỏ nhất (f/)"
            min={0.7}
            max={64}
            value={values.min_aperture}
            error={errors.min_aperture}
            hint="Tùy chọn. VD: 16, 22"
            onChange={(value) => update("min_aperture", value)}
          />
          <div className="sm:col-span-2">
            <CheckboxGroup
              legend="Độ phủ định dạng"
              required
              options={formatOptions}
              values={values.format_coverage}
              onToggle={toggleFormat}
              error={errors.format_coverage}
            />
          </div>
        </div>

        <Field
          id="code-preview"
          label="Mã dự kiến (CR-05)"
          hint="Mã chính thức do hệ thống sinh khi lưu."
        >
          <p className="rounded-lg border bg-muted/40 px-3 py-2 font-mono text-xs">
            {preview || "LENS-…"}
          </p>
        </Field>

        <FormFooter
          submitting={submitting}
          onCancel={onCancel}
          submitLabel={isEditing ? "Lưu thay đổi" : "Thêm ống kính"}
        />
      </form>
    </DialogContent>
  );
}
