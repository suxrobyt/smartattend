import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Teacher sets (or resets) a student's login password.
// If the student has no login account yet, it is created.
export async function POST(request: NextRequest) {
  try {
    const { student_id, new_password } = await request.json();

    if (!student_id || typeof new_password !== 'string' || new_password.length < 8) {
      return NextResponse.json(
        { error: "Parol kamida 8 ta belgidan iborat bo'lishi kerak" },
        { status: 400 }
      );
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server kaliti (SUPABASE_SERVICE_ROLE_KEY) Vercel da kiritilmagan' },
        { status: 500 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Kirish talab qilinadi' }, { status: 401 });
    }

    // Student row (visible to teachers of the same group through RLS)
    const { data: student } = await supabase
      .from('students')
      .select('id, user_id, group_id, email')
      .eq('id', student_id)
      .single();
    if (!student) {
      return NextResponse.json({ error: 'Talaba topilmadi' }, { status: 404 });
    }

    // Caller must be a teacher of this student's group
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .eq('group_id', student.group_id)
      .maybeSingle();
    if (!teacher) {
      return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 });
    }

    const admin = getSupabaseAdmin();
    let created = false;

    if (student.user_id) {
      const { error } = await admin.auth.admin.updateUserById(student.user_id, {
        password: new_password,
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: student.email,
        password: new_password,
        email_confirm: true,
        user_metadata: { role: 'student' },
      });

      let authUserId = data?.user?.id;

      if (error || !authUserId) {
        // The email may already exist in Auth (created by hand): find it and reuse
        const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
        const existing = list?.users?.find(
          (u: any) => (u.email || '').toLowerCase() === String(student.email).toLowerCase()
        );
        if (!existing) {
          return NextResponse.json(
            { error: error?.message || 'Akkaunt yaratilmadi' },
            { status: 400 }
          );
        }
        const { error: ue } = await admin.auth.admin.updateUserById(existing.id, {
          password: new_password,
          user_metadata: { ...(existing.user_metadata || {}), role: 'student' },
        });
        if (ue) {
          return NextResponse.json({ error: ue.message }, { status: 400 });
        }
        authUserId = existing.id;
      }

      const { error: linkError } = await admin
        .from('students')
        .update({ user_id: authUserId })
        .eq('id', student.id);
      if (linkError) {
        return NextResponse.json({ error: linkError.message }, { status: 500 });
      }
      created = true;
    }

    await supabase.rpc('log_audit_event', {
      p_action: created ? 'student_account_created' : 'password_reset',
      p_entity_type: 'student',
      p_entity_id: student.id,
      p_changes: { by: user.id },
    });

    return NextResponse.json({ success: true, created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Xato' }, { status: 500 });
  }
}
