import { ContestConfigWizard } from "@/components/contest/contest-config-wizard";

type EditContestPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditContestPage({
  params,
}: EditContestPageProps) {
  const { id } = await params;
  return <ContestConfigWizard mode="edit" contestId={id} />;
}
