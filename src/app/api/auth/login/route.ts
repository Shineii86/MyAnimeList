import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'changeme';

    if (username === adminUser && password === adminPass) {
      const response = NextResponse.json({ success: true });
      response.cookies.set('anime-admin-auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
