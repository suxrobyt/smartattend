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

    // Verify teacher owns session
    const { data: session } = await supabase
      .from('attendance_sessions')
      .select('teacher_id, group_id')
      .eq('id', session_id)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .eq('id', session.teacher_id)
      .single();

    if (!teacher) {
      return NextResponse.json(
        { error: 'You do not have permission' },
        { status: 403 }
      );
    }

    // Close session
    const { error } = await supabase
      .from('attendance_sessions')
      .update({ status: 'closed' })
      .eq('id', session_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Mark absent students who didn't attend
    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('group_id', session.group_id);

    if (students) {
      const { data: marked } = await supabase
        .from('attendance_records')
        .select('student_id')
        .eq('session_id', session_id);

      const markedIds = marked?.map((m) => m.student_id) || [];
      const absentStudents = students.filter((s) => !markedIds.includes(s.id));

      if (absentStudents.length > 0) {
        await supabase.from('attendance_records').insert(
          absentStudents.map((s) => ({
            session_id,
            student_id: s.id,
            status: 'absent',
            marked_at: new Date().toISOString(),
            marked_by: teacher.id,
          }))
        );
      }
    }

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_action: 'attendance_closed',
      p_entity_type: 'attendance_session',
      p_entity_id: session_id,
      p_changes: null,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
