import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { session_id } = await request.json();

  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get student
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!student) {
      return NextResponse.json(
        { error: 'Student record not found' },
        { status: 400 }
      );
    }

    // Check if already marked
    const { data: existing } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('session_id', session_id)
      .eq('student_id', student.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'You have already marked attendance' },
        { status: 400 }
      );
    }

    // Get session to check timing
    const { data: session } = await supabase
      .from('attendance_sessions')
      .select('start_time, end_time, attendance_duration_minutes')
      .eq('id', session_id)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Determine status based on time
    const now = new Date();
    const [hours, minutes] = session.start_time.split(':');
    const sessionStart = new Date();
    sessionStart.setHours(parseInt(hours), parseInt(minutes), 0);

    let status = 'present';
    if (now > new Date(sessionStart.getTime() + session.attendance_duration_minutes * 60000)) {
      status = 'late';
    }

    // Record attendance
    const { data: record, error } = await supabase
      .from('attendance_records')
      .insert({
        session_id,
        student_id: student.id,
        status,
        marked_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Notify student
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Attendance Recorded',
      message: `You have been marked ${status}`,
      type: 'attendance',
    });

    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
