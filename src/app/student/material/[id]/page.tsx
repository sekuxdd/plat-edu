import { StudentMaterialPage } from "@/components/student-material-page";

type MaterialPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MaterialPage({ params }: MaterialPageProps) {
  const { id } = await params;

  return <StudentMaterialPage materialId={id} />;
}
