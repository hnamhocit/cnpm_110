import { Suspense } from "react";

import { Card, CardContent } from "@/components/ui/card";

import { CriteriaConfigClient } from "./criteria-client";

export default function CriteriaConfigPage() {
  return (
    <Suspense
      fallback={
        <Card className="mx-auto max-w-4xl">
          <CardContent className="p-10 text-sm text-muted-foreground">
            Đang chuẩn bị biểu mẫu tiêu chí chấm điểm...
          </CardContent>
        </Card>
      }
    >
      <CriteriaConfigClient />
    </Suspense>
  );
}
