import { exportProjectDataXLSX, exportAllProjectsXLSX } from "@/lib/export";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectName = searchParams.get("project");
    const exportType = searchParams.get("type") || "single"; // 'single' or 'all'

    let buffer: Buffer;
    let fileName: string;

    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();

    if (exportType === "all") {
      // Export all projects
      buffer = exportAllProjectsXLSX();
      fileName = `${month}-${year}-all-projects.xlsx`;
    } else {
      // Export single project
      if (!projectName) {
        return NextResponse.json({ error: "Project name not specified" }, { status: 400 });
      }

      buffer = exportProjectDataXLSX(projectName);
      fileName = `${month}-${year}-${projectName}.xlsx`;
    }

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting project:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error exporting project" },
      { status: 500 }
    );
  }
}
