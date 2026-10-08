import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const group_id = searchParams.get('group_id');

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

    const { data: students, error } = await supabase
      .from('students')
      .select(
        `
        id,
        full_name,
        username,
        email,
        status,
        attendance_percentage,
        last_login,
        created_at
      `
      )
      .eq('group_id', group_id)
      .order('full_name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(students);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
