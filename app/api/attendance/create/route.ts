import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const {
    group_id,
    subject,
    session_date,
    start_time,
    end_time,
    attendance_duration_minutes,
  } = await request.json();

  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify teacher owns group
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .eq('group_id', group_id)
      .single();

    if (!teacher) {
      return NextResponse.json(
        { error: 'You do not have permission' },
        { status: 403 }
      );
    }

    // Create attendance session
    const { data: session, error } = await supabase
      .from('attendance_sessions')
      .insert({
        group_id,
        teacher_id: teacher.id,
        subject,
        session_date,
        start_time,
        end_time,
        attendance_duration_minutes,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_action: 'attendance_created',
      p_entity_type: 'attendance_session',
      p_entity_id: session.id,
      p_changes: { subject, date: session_date },
    });

    // Notify students
    const { data: students } = await supabase
      .from('students')
      .select('user_id')
      .eq('group_id', group_id);

    if (students) {
      const notifications = students.map((s) => ({
        user_id: s.user_id,
        title: 'Attendance Open',
        message: `${subject} attendance is now open`,
        type: 'attendance',
      }));

      await supabase.from('notifications').insert(notifications);
    }

    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
