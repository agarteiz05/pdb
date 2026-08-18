import { NextRequest, NextResponse } from "next/server";

async function hash(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const expected = process.env.ADMIN_PASSWORD || "";

  if (!password || password !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("pdb_admin", await hash(password), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
