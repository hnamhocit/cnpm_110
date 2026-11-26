"use client";

import { cn } from "cn";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FieldError } from "@/lib/master-data-validation";

type Option = { value: string; label: string };

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: FieldError;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-semibold">
        {label}
        {required && (
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        )}
      </Label>
      {children}
      {hint && !error && (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: FieldError;
  hint?: string;
  required?: boolean;
  type?: "text" | "email" | "url" | "tel";
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  required,
  type = "text",
  maxLength,
  placeholder,
  disabled,
  className,
}: TextFieldProps) {
  return (
    <Field
      id={id}
      label={label}
      required={required}
      error={error}
      hint={hint}
      className={className}
    >
      <Input
        id={id}
        type={type}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

type NumberFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: FieldError;
  hint?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number | "any";
  placeholder?: string;
  disabled?: boolean;
};

export function NumberField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  required,
  min,
  max,
  step = "any",
  placeholder,
  disabled,
}: NumberFieldProps) {
  return (
    <Field id={id} label={label} required={required} error={error} hint={hint}>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        value={value}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly Option[];
  error?: FieldError;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
};

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  error,
  hint,
  required,
  disabled,
}: SelectFieldProps) {
  return (
    <Field id={id} label={label} required={required} error={error} hint={hint}>
      <select
        id={id}
        value={value}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

type TextareaFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: FieldError;
  hint?: string;
  maxLength?: number;
  rows?: number;
};

export function TextareaField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  maxLength,
  rows = 3,
}: TextareaFieldProps) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        value={value}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

type CheckboxFieldProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
};

export function CheckboxField({
  id,
  label,
  checked,
  onChange,
  description,
}: CheckboxFieldProps) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border bg-muted/30 px-3 py-2.5">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
      />
      <div className="grid gap-0.5">
        <Label htmlFor={id} className="text-xs font-medium">
          {label}
        </Label>
        {description && (
          <p className="text-[11px] text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

type CheckboxGroupProps = {
  legend: string;
  options: readonly Option[];
  values: readonly string[];
  onToggle: (value: string) => void;
  error?: FieldError;
  hint?: string;
  required?: boolean;
};

export function CheckboxGroup({
  legend,
  options,
  values,
  onToggle,
  error,
  hint,
  required,
}: CheckboxGroupProps) {
  return (
    <fieldset className="grid gap-1.5">
      <legend className="text-xs font-semibold">
        {legend}
        {required && (
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        )}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = values.includes(option.value);
          return (
            <label
              key={option.value}
              htmlFor={`md-opt-${option.value}`}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors",
                checked
                  ? "border-brand-solid/40 bg-brand-soft text-brand-text"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/60",
              )}
            >
              <Checkbox
                id={`md-opt-${option.value}`}
                checked={checked}
                onCheckedChange={() => onToggle(option.value)}
              />
              {option.label}
            </label>
          );
        })}
      </div>
      {hint && !error && (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error.message}
        </p>
      )}
    </fieldset>
  );
}

type FormFooterProps = {
  submitting: boolean;
  onCancel: () => void;
  submitLabel?: string;
};

export function FormFooter({
  submitting,
  onCancel,
  submitLabel = "Lưu",
}: FormFooterProps) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={submitting}
      >
        Hủy
      </Button>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Đang lưu…" : submitLabel}
      </Button>
    </div>
  );
}
