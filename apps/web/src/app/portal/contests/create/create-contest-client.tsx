"use client";

import { useSearchParams } from "next/navigation";

import { ContestConfigWizard } from "@/components/contest/contest-config-wizard";

export function CreateContestClient() {
  const searchParams = useSearchParams();
  const duplicateFrom =
    searchParams.get("duplicateFrom") ??
    searchParams.get("sourceId") ??
    undefined;

  return (
    <ContestConfigWizard
      mode={duplicateFrom ? "duplicate" : "create"}
      sourceId={duplicateFrom}
    />
  );
}
