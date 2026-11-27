import { NextResponse } from 'next/server';
import { clearSessionCookie, getSessionUser } from '@/lib/auth';
import { findNeonUserByEmail, neonCustomerToPublicUser } from '@/lib/neon-users';

export async function GET() {
  const sessionUser = getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ user: null });
  }

  try {
    const neonUser = await findNeonUserByEmail(sessionUser.email);
    if (!neonUser || neonUser.status === 'blocked') {
      clearSessionCookie();
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({ user: neonCustomerToPublicUser(neonUser) });
  } catch {
    clearSessionCookie();
    return NextResponse.json({ user: null });
  }
}
