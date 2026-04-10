import { StudentTestRunner } from "@/components/student-test-runner";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function StudentTestPage({ params }: PageProps) {
  const { id } = await params;

  return <StudentTestRunner testId={id} />;
}