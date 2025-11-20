import {
  deleteTimeEntry,
  getAllTimeEntries,
  getProjectEntries,
  saveTimeEntry,
  updateTimeEntry,
} from "@/lib/database";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const entry = await request.json();

    if (!entry.project || !entry.date || !entry.duration || !entry.startTime || !entry.endTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    saveTimeEntry(entry);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save time entry" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const project = searchParams.get("project");

    if (project) {
      const entries = getProjectEntries(project);
      return NextResponse.json({ entries });
    }

    // No project specified, return all entries
    const entries = getAllTimeEntries();
    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get time entries" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Entry ID required" }, { status: 400 });
    }
    updateTimeEntry(id, updates);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update time entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Entry ID required" }, { status: 400 });
    }
    deleteTimeEntry(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete time entry" },
      { status: 500 }
    );
  }
}
