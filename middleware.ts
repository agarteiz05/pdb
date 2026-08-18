import { NextRequest, NextResponse } from "next/server";

async function expectedHash(): Promise<string> {
  const password = process.env.ADMIN_PASSWORD || "";
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const cookie = request.cookies.get("pdb_admin")?.value;
  const expected = await expectedHash();

  if (cookie && cookie === expected) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
