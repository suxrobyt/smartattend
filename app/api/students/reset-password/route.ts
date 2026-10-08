import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  const { student_id, new_password } = await request.json();

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
      .select('user_id, group_id')
      .eq('id', student_id)
      .single();

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Verify teacher owns group
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .eq('group_id', student.group_id)
      .single();

    if (!teacher) {
      return NextResponse.json(
        { error: 'You do not have permission' },
        { status: 403 }
      );
    }

    // Use service role to reset password
    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      student.user_id,
      { password: new_password }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_action: 'password_reset',
      p_entity_type: 'student',
      p_entity_id: student_id,
      p_changes: { reset_by: user.id },
    });

    // Notify student
    await supabase.from('notifications').insert({
      user_id: student.user_id,
      title: 'Password Reset',
      message: 'Your password has been reset by your teacher',
      type: 'system',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
