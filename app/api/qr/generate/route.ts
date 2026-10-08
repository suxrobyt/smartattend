import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

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
      .select('teacher_id')
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

    // Generate QR token
    const qr_token = uuidv4();
    const qr_token_expires_at = new Date(Date.now() + 30 * 60000).toISOString();

    const { error } = await supabase
      .from('attendance_sessions')
      .update({ qr_token, qr_token_expires_at })
      .eq('id', session_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ qr_token });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
