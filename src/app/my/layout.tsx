import { requireEmployeePage } from "@/lib/auth";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  await requireEmployeePage();
  return children;
}
