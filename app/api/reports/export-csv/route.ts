import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { group_id, from_date, to_date } = await request.json();

  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify teacher
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

    // Get attendance data
    const { data: records } = await supabase
      .from('attendance_records')
      .select(
        `
        student_id,
        status,
        created_at,
        students (full_name, username),
        attendance_sessions (subject, session_date)
      `
      )
      .like('created_at', `${from_date}%`)
      .lte('created_at', `${to_date}T23:59:59`)
      .eq(
        'attendance_sessions.group_id',
        group_id
      );

    if (!records) {
      return NextResponse.json(
        { error: 'No records found' },
        { status: 404 }
      );
    }

    // Build CSV
    let csv = 'Name,Username,Subject,Date,Status\n';
    records.forEach((record: any) => {
      csv += `${record.students.full_name},${record.students.username},${record.attendance_sessions.subject},${record.attendance_sessions.session_date},${record.status}\n`;
    });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="attendance_report.csv"',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
