import { NextResponse } from 'next/server';
import { saveTimeEntry, getProjectEntries } from '@/lib/excel';

export async function POST(request: Request) {
  try {
    const entry = await request.json();

    if (!entry.project || !entry.date || !entry.duration || !entry.startTime || !entry.endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    saveTimeEntry(entry);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save time entry' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const project = searchParams.get('project');

    if (!project) {
      return NextResponse.json({ error: 'Project name required' }, { status: 400 });
    }

    const entries = getProjectEntries(project);
    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get time entries' }, { status: 500 });
  }
}
