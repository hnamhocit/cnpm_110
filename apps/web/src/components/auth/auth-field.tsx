"use client";

import { Eye, EyeOff } from "lucide-react";
import { type ComponentProps, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AuthFieldProps = ComponentProps<typeof Input> & {
  id: string;
  label: string;
  labelClassName?: string;
};

export function AuthField({
  id,
  label,
  labelClassName,
  type,
  className,
  ...props
}: AuthFieldProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>
      {isPassword ? (
        <div className="relative">
          <Input {...props} id={id} name={id} type={visible ? "text" : "password"} className={cn(className, "pr-11")} />
          <button
            type="button"
            aria-label={visible ? `Ẩn ${label.toLowerCase()}` : `Hiện ${label.toLowerCase()}`}
            aria-controls={id}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            onClick={() => setVisible((current) => !current)}
          >
            {visible ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
          </button>
        </div>
      ) : (
        <Input {...props} id={id} name={id} type={type} className={className} />
      )}
    </div>
  );
}
