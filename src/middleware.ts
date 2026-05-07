import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth for login page, API login, and static assets
  if (
    pathname === '/login' ||
    pathname === '/api/auth/login' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const authCookie = request.cookies.get('anime-admin-auth');
  if (authCookie?.value === 'authenticated') {
    return NextResponse.next();
  }

  // Check Basic Auth header as fallback
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Basic ')) {
    const decoded = atob(authHeader.slice(6));
    const [username, password] = decoded.split(':');
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'changeme';
    if (username === adminUser && password === adminPass) {
      return NextResponse.next();
    }
  }

  // Redirect to login for pages
  if (!pathname.startsWith('/api/')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Return 401 for API routes
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
