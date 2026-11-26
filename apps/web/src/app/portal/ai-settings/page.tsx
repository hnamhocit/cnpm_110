import AiSettingsPanel from "@/components/ai/ai-settings-panel";

export default function AiSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Cấu hình AI</h1>
        <p className="text-sm text-[var(--portal-muted)]">
          UC-09 · ngưỡng cảnh báo và thử ngưỡng
        </p>
      </div>
      <AiSettingsPanel />
    </div>
  );
}
