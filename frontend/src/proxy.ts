import { NextRequest, NextResponse } from 'next/server';
export function proxy(request: NextRequest) {
  // Private review server cannot accept subscriptions, admin writes or other mutations.
  if (!['GET', 'HEAD'].includes(request.method)) {
    return NextResponse.json({ data: null, error: 'Private review: writes are disabled.' }, {
      status: 405, headers: { Allow: 'GET, HEAD', 'X-Robots-Tag': 'noindex, nofollow, noarchive' },
    });
  }
  return NextResponse.next();
}
export const config = { matcher: '/:path*' };
