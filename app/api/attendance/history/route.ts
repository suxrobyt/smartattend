import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const student_id = searchParams.get('student_id');
  const from_date = searchParams.get('from_date');
  const to_date = searchParams.get('to_date');

  const supabase = createRouteHandlerClient({ cookies });

  try {
    let query = supabase
      .from('attendance_records')
      .select(
        `
        id,
        status,
        marked_at,
        created_at,
        attendance_sessions (
          subject,
          session_date,
          start_time,
          end_time
        )
      `
      )
      .eq('student_id', student_id);

    if (from_date) {
      query = query.gte('created_at', from_date);
    }

    if (to_date) {
      query = query.lte('created_at', to_date);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
