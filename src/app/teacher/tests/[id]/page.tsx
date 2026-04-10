import { TeacherTestEditor } from "@/components/teacher-test-editor";

type TeacherTestPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TeacherTestPage({ params }: TeacherTestPageProps) {
  const { id } = await params;

  return <TeacherTestEditor testId={id} />;
}
