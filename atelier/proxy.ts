import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, readSession } from './lib/session';

// pages need a session; api routes authenticate themselves (cookie, personal key, oauth, signatures)
export function proxy(req: NextRequest) {
  if (readSession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!api/|_next/|login|\\.well-known|manifest\\.webmanifest|sw\\.js|icon|apple-touch-icon|favicon).*)'],
};
