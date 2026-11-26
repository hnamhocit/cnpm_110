import { Suspense } from "react";

import { Card, CardContent } from "@/components/ui/card";

import { CreateContestClient } from "./create-contest-client";

function WizardFallback() {
  return (
    <Card className="mx-auto max-w-5xl">
      <CardContent className="p-10 text-sm text-muted-foreground">
        Đang chuẩn bị biểu mẫu cấu hình cuộc thi...
      </CardContent>
    </Card>
  );
}

export default function CreateContestPage() {
  return (
    <Suspense fallback={<WizardFallback />}>
      <CreateContestClient />
    </Suspense>
  );
}
