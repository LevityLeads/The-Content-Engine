import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Auth disabled for now - single user mode
  // TODO: Re-enable auth when adding multi-user support
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)",
  ],
};
