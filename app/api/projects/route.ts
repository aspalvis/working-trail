import { NextResponse } from 'next/server';
import { getProjects, addProject } from '@/lib/excel';

export async function GET() {
  try {
    const projects = getProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { projectName } = await request.json();

    if (!projectName || typeof projectName !== 'string') {
      return NextResponse.json({ error: 'Invalid project name' }, { status: 400 });
    }

    addProject(projectName);
    return NextResponse.json({ success: true, projectName });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add project' }, { status: 500 });
  }
}
