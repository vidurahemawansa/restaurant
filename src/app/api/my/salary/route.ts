import { NextResponse } from "next/server";
import { authErrorResponse, requireEmployeeSelf } from "@/lib/auth";
import { getEmployeeSalarySummary } from "@/lib/salary";

export async function GET() {
  try {
    const { employeeId } = await requireEmployeeSelf();
    const summary = await getEmployeeSalarySummary(employeeId);
    return NextResponse.json(summary);
  } catch (err) {
    return authErrorResponse(err);
  }
}
