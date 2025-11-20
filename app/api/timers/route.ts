import { NextResponse } from 'next/server';
import { getActiveTimers, startTimer, updateTimer, stopTimer, deleteTimer, getTimer } from '@/lib/excel';

export async function GET() {
  try {
    const timers = getActiveTimers();
    return NextResponse.json({ timers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to get timers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, timerId, project, elapsedTime } = body;

    if (!action || !timerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let timer;

    switch (action) {
      case 'start':
        if (!project) {
          return NextResponse.json({ error: 'Project name required for start action' }, { status: 400 });
        }
        timer = startTimer(timerId, project);
        break;

      case 'update':
        if (elapsedTime === undefined) {
          return NextResponse.json({ error: 'Elapsed time required for update action' }, { status: 400 });
        }
        timer = updateTimer(timerId, elapsedTime);
        break;

      case 'stop':
        timer = stopTimer(timerId);
        break;

      case 'delete':
        const deleted = deleteTimer(timerId);
        return NextResponse.json({ success: deleted });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!timer) {
      return NextResponse.json({ error: 'Timer not found' }, { status: 404 });
    }

    return NextResponse.json({ timer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process timer action' }, { status: 500 });
  }
}
