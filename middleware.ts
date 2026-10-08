import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect routes
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
  const isStudentPage = req.nextUrl.pathname.startsWith('/student');
  const isTeacherPage = req.nextUrl.pathname.startsWith('/teacher');

  if (!session && (isStudentPage || isTeacherPage)) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  if (session && isAuthPage) {
    // Redirect to dashboard based on role
    const role = session.user.user_metadata?.role;
    if (role === 'student') {
      return NextResponse.redirect(new URL('/student/dashboard', req.url));
    } else if (role === 'teacher') {
      return NextResponse.redirect(new URL('/teacher/dashboard', req.url));
    }
  }

  // Role-based access
  if (isStudentPage && session?.user.user_metadata?.role !== 'student') {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  if (isTeacherPage && session?.user.user_metadata?.role !== 'teacher') {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/student/:path*', '/teacher/:path*', '/auth/:path*'],
};
