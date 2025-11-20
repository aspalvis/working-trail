import { addProject, getProjects, updateProjectRate } from "@/lib/database";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const projects = getProjects(); // [{name, hourlyRate}]
    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { projectName, hourlyRate } = await request.json();

    if (!projectName || typeof projectName !== "string") {
      return NextResponse.json({ error: "Invalid project name" }, { status: 400 });
    }
    const rateNum = hourlyRate !== undefined ? parseFloat(hourlyRate) : 0;
    addProject(projectName, isNaN(rateNum) ? 0 : rateNum);
    return NextResponse.json({
      success: true,
      project: { name: projectName, hourlyRate: isNaN(rateNum) ? 0 : rateNum },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add project" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { projectName, hourlyRate } = await request.json();
    if (!projectName || typeof projectName !== "string") {
      return NextResponse.json({ error: "Invalid project name" }, { status: 400 });
    }
    const rateNum = hourlyRate !== undefined ? parseFloat(hourlyRate) : NaN;
    if (isNaN(rateNum) || rateNum < 0) {
      return NextResponse.json({ error: "Invalid hourly rate" }, { status: 400 });
    }
    updateProjectRate(projectName, rateNum);
    return NextResponse.json({
      success: true,
      project: { name: projectName, hourlyRate: rateNum },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update project" },
      { status: 500 }
    );
  }
}
