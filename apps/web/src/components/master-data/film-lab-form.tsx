"use client";

import { type FormEvent, useState } from "react";

import {
  CheckboxGroup,
  Field,
  FormFooter,
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
  validateFilmLab,
} from "@/lib/master-data-validation";
import {
  FILM_PROCESSES,
  type FilmLab,
  type FilmLabInput,
  type FilmProcess,
  PROCESS_LABELS,
  SCANNER_LABELS,
  SCANNERS,
  type Scanner,
} from "@/types/master-data";

type FormState = {
  name: string;
  country_code: string;
  city: string;
  address: string;
  website_url: string;
  email: string;
  phone: string;
  supported_processes: FilmProcess[];
  scanners: Scanner[];
};

type FilmLabFormProps = {
  initial?: FilmLab | null;
  submitting: boolean;
  serverError?: string;
  onCancel: () => void;
  onSubmit: (input: FilmLabInput) => void | Promise<void>;
};

const processOptions = toOptions(FILM_PROCESSES, PROCESS_LABELS);
const scannerOptions = toOptions(SCANNERS, SCANNER_LABELS);

function toFormState(initial?: FilmLab | null): FormState {
  return {
    name: initial?.name ?? "",
    country_code: initial?.country_code ?? "VN",
    city: initial?.city ?? "",
    address: initial?.address ?? "",
    website_url: initial?.website_url ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    supported_processes: initial?.supported_processes ?? ["C-41"],
    scanners: initial?.scanners ?? ["NORITSU_HS1800"],
  };
}

function toInput(values: FormState): FilmLabInput {
  return {
    name: values.name,
    country_code: values.country_code.trim().toUpperCase(),
    city: values.city,
    address: values.address.trim() || null,
    website_url: values.website_url.trim() || null,
    email: values.email.trim() || null,
    phone: values.phone.trim() || null,
    supported_processes: values.supported_processes,
    scanners: values.scanners,
  };
}

export function FilmLabForm({
  initial,
  submitting,
  serverError,
  onCancel,
  onSubmit,
}: FilmLabFormProps) {
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

  function toggleProcess(process: string) {
    const next = values.supported_processes.includes(process as FilmProcess)
      ? values.supported_processes.filter((item) => item !== process)
      : [...values.supported_processes, process as FilmProcess];
    update("supported_processes", next);
  }

  function toggleScanner(scanner: string) {
    const next = values.scanners.includes(scanner as Scanner)
      ? values.scanners.filter((item) => item !== scanner)
      : [...values.scanners, scanner as Scanner];
    update("scanners", next);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = toInput(values);
    const nextErrors = validateFilmLab(input);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await onSubmit(input);
  }

  const preview = buildMasterDataCode("film-labs", toInput(values));

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "Cập nhật phòng Lab" : "Thêm phòng Lab"}
        </DialogTitle>
        <DialogDescription>
          Danh bạ phòng tráng &amp; quét phim dùng để chuẩn hóa metadata hậu kỳ
          (BR-22).
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
            id="name"
            label="Tên phòng Lab"
            required
            maxLength={150}
            value={values.name}
            error={errors.name}
            onChange={(value) => update("name", value)}
          />
          <TextField
            id="country_code"
            label="Mã quốc gia (ISO 3166-1)"
            required
            maxLength={2}
            value={values.country_code}
            error={errors.country_code}
            hint="2 chữ cái viết hoa. VD: VN, US, JP"
            onChange={(value) =>
              update("country_code", value.toUpperCase().slice(0, 2))
            }
          />
          <TextField
            id="city"
            label="Thành phố"
            required
            maxLength={100}
            value={values.city}
            error={errors.city}
            onChange={(value) => update("city", value)}
          />
          <TextField
            id="phone"
            label="Số điện thoại"
            type="tel"
            maxLength={30}
            value={values.phone}
            error={errors.phone}
            hint="Tùy chọn"
            onChange={(value) => update("phone", value)}
          />
          <TextField
            id="email"
            label="Email liên hệ"
            type="email"
            maxLength={150}
            value={values.email}
            error={errors.email}
            hint="Tùy chọn"
            onChange={(value) => update("email", value)}
          />
          <TextField
            id="website_url"
            label="Website"
            type="url"
            maxLength={255}
            value={values.website_url}
            error={errors.website_url}
            hint="Tùy chọn. Bắt đầu bằng http(s)://"
            onChange={(value) => update("website_url", value)}
          />
          <div className="sm:col-span-2">
            <TextField
              id="address"
              label="Địa chỉ"
              maxLength={500}
              value={values.address}
              error={errors.address}
              hint="Tùy chọn"
              onChange={(value) => update("address", value)}
            />
          </div>
          <div className="sm:col-span-2">
            <CheckboxGroup
              legend="Quy trình tráng hỗ trợ"
              required
              options={processOptions}
              values={values.supported_processes}
              onToggle={toggleProcess}
              error={errors.supported_processes}
            />
          </div>
          <div className="sm:col-span-2">
            <CheckboxGroup
              legend="Máy quét hỗ trợ"
              required
              options={scannerOptions}
              values={values.scanners}
              onToggle={toggleScanner}
              error={errors.scanners}
            />
          </div>
        </div>

        <Field
          id="code-preview"
          label="Mã dự kiến (CR-05)"
          hint="Mã chính thức do hệ thống sinh khi lưu."
        >
          <p className="rounded-lg border bg-muted/40 px-3 py-2 font-mono text-xs">
            {preview || "LAB-…"}
          </p>
        </Field>

        <FormFooter
          submitting={submitting}
          onCancel={onCancel}
          submitLabel={isEditing ? "Lưu thay đổi" : "Thêm phòng Lab"}
        />
      </form>
    </DialogContent>
  );
}
