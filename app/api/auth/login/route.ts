import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_action: 'login',
      p_entity_type: 'user',
      p_entity_id: data.user.id,
      p_changes: { ip: request.headers.get('x-forwarded-for') },
    });

    return NextResponse.json({
      user: data.user,
      session: data.session,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
