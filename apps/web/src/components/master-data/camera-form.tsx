"use client";

import { type FormEvent, useState } from "react";

import {
  CheckboxField,
  Field,
  FormFooter,
  NumberField,
  SelectField,
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
import { type FieldErrors, validateCamera } from "@/lib/master-data-validation";
import {
  CAMERA_TYPE_LABELS,
  CAMERA_TYPES,
  type Camera,
  type CameraInput,
  type CameraType,
  FILM_FORMATS,
  type FilmFormat,
  FORMAT_LABELS,
  SHUTTER_LABELS,
  SHUTTER_MECHANISMS,
  type ShutterMechanism,
} from "@/types/master-data";

type FormState = {
  brand: string;
  model: string;
  camera_type: CameraType;
  supported_format: FilmFormat;
  default_lens_mount: string;
  has_fixed_lens: boolean;
  fixed_lens_specs: string;
  shutter_mechanism: ShutterMechanism;
  production_start_year: string;
  production_end_year: string;
};

type CameraFormProps = {
  initial?: Camera | null;
  submitting: boolean;
  serverError?: string;
  onCancel: () => void;
  onSubmit: (input: CameraInput) => void | Promise<void>;
};

const cameraTypeOptions = toOptions(CAMERA_TYPES, CAMERA_TYPE_LABELS);
const formatOptions = toOptions(FILM_FORMATS, FORMAT_LABELS);
const shutterOptions = toOptions(SHUTTER_MECHANISMS, SHUTTER_LABELS);

function toFormState(initial?: Camera | null): FormState {
  return {
    brand: initial?.brand ?? "",
    model: initial?.model ?? "",
    camera_type: initial?.camera_type ?? "SLR",
    supported_format: initial?.supported_format ?? "135",
    default_lens_mount: initial?.default_lens_mount ?? "",
    has_fixed_lens: initial?.has_fixed_lens ?? false,
    fixed_lens_specs: initial?.fixed_lens_specs ?? "",
    shutter_mechanism: initial?.shutter_mechanism ?? "MECHANICAL",
    production_start_year: initial?.production_start_year
      ? String(initial.production_start_year)
      : "",
    production_end_year: initial?.production_end_year
      ? String(initial.production_end_year)
      : "",
  };
}

function parseYear(value: string): number | null {
  const text = value.trim();
  return text === "" ? null : Number(text);
}

function toInput(values: FormState): CameraInput {
  return {
    brand: values.brand,
    model: values.model,
    camera_type: values.camera_type,
    supported_format: values.supported_format,
    default_lens_mount: values.default_lens_mount.trim() || null,
    has_fixed_lens: values.has_fixed_lens,
    fixed_lens_specs: values.fixed_lens_specs.trim() || null,
    shutter_mechanism: values.shutter_mechanism,
    production_start_year: parseYear(values.production_start_year),
    production_end_year: parseYear(values.production_end_year),
  };
}

export function CameraForm({
  initial,
  submitting,
  serverError,
  onCancel,
  onSubmit,
}: CameraFormProps) {
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

  function updateFixedLens(hasFixedLens: boolean) {
    setValues((prev) => ({
      ...prev,
      has_fixed_lens: hasFixedLens,
      default_lens_mount: hasFixedLens ? "Fixed" : prev.default_lens_mount,
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.default_lens_mount;
      delete next.fixed_lens_specs;
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = toInput(values);
    const nextErrors = validateCamera(input);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await onSubmit(input);
  }

  const preview = buildMasterDataCode("cameras", toInput(values));

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "Cập nhật máy ảnh" : "Thêm máy ảnh"}
        </DialogTitle>
        <DialogDescription>
          Thân máy ảnh phim dùng để chuẩn hóa metadata khi nộp bài (BR-22).
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
            onChange={(value) => update("model", value)}
          />
          <SelectField
            id="camera_type"
            label="Cơ chế ngắm/chụp"
            required
            value={values.camera_type}
            options={cameraTypeOptions}
            error={errors.camera_type}
            onChange={(value) => update("camera_type", value as CameraType)}
          />
          <SelectField
            id="supported_format"
            label="Khổ phim"
            required
            value={values.supported_format}
            options={formatOptions}
            error={errors.supported_format}
            onChange={(value) =>
              update("supported_format", value as FilmFormat)
            }
          />
          <TextField
            id="default_lens_mount"
            label="Ngàm ống kính mặc định"
            maxLength={50}
            value={values.default_lens_mount}
            error={errors.default_lens_mount}
            disabled={values.has_fixed_lens}
            hint="VD: Leica M, Nikon F, M42"
            onChange={(value) => update("default_lens_mount", value)}
          />
          <SelectField
            id="shutter_mechanism"
            label="Cơ chế màn trập"
            required
            value={values.shutter_mechanism}
            options={shutterOptions}
            error={errors.shutter_mechanism}
            onChange={(value) =>
              update("shutter_mechanism", value as ShutterMechanism)
            }
          />
          <div className="sm:col-span-2">
            <CheckboxField
              id="has_fixed_lens"
              label="Ống kính liền cố định"
              checked={values.has_fixed_lens}
              description="Máy không tháo rời được ống kính (ngàm mặc định sẽ là “Fixed”)."
              onChange={updateFixedLens}
            />
          </div>
          {values.has_fixed_lens && (
            <div className="sm:col-span-2">
              <TextField
                id="fixed_lens_specs"
                label="Thông số ống kính liền"
                required
                maxLength={150}
                value={values.fixed_lens_specs}
                error={errors.fixed_lens_specs}
                hint="Tối thiểu 5 ký tự. VD: F.Zuiko 38mm f/1.8"
                onChange={(value) => update("fixed_lens_specs", value)}
              />
            </div>
          )}
          <NumberField
            id="production_start_year"
            label="Năm bắt đầu sản xuất"
            min={1850}
            max={new Date().getFullYear() + 1}
            step={1}
            value={values.production_start_year}
            error={errors.production_start_year}
            onChange={(value) => update("production_start_year", value)}
          />
          <NumberField
            id="production_end_year"
            label="Năm ngừng sản xuất"
            min={1850}
            max={new Date().getFullYear() + 1}
            step={1}
            value={values.production_end_year}
            error={errors.production_end_year}
            onChange={(value) => update("production_end_year", value)}
          />
        </div>

        <Field
          id="code-preview"
          label="Mã dự kiến (CR-05)"
          hint="Mã chính thức do hệ thống sinh khi lưu."
        >
          <p className="rounded-lg border bg-muted/40 px-3 py-2 font-mono text-xs">
            {preview || "CAM-…"}
          </p>
        </Field>

        <FormFooter
          submitting={submitting}
          onCancel={onCancel}
          submitLabel={isEditing ? "Lưu thay đổi" : "Thêm máy ảnh"}
        />
      </form>
    </DialogContent>
  );
}
