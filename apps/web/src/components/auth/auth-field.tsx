import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthFieldProps = ComponentProps<typeof Input> & {
  id: string;
  label: string;
};

export function AuthField({ id, label, ...props }: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} {...props} />
    </div>
  );
}
