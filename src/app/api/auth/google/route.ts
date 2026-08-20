import { NextRequest, NextResponse } from "next/server";
import {
  GOOGLE_FROM_COOKIE,
  GOOGLE_STATE_COOKIE,
  buildGoogleAuthUrl,
  generateOAuthState,
  isGoogleAuthConfigured,
} from "@/lib/auth/google";

export async function GET(request: NextRequest) {
  if (!isGoogleAuthConfigured()) {
    return NextResponse.json(
      { error: "Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env" },
      { status: 503 }
    );
  }

  const state = generateOAuthState();
  const from = request.nextUrl.searchParams.get("from");
  const url = buildGoogleAuthUrl(state);

  const res = NextResponse.redirect(url);
  res.cookies.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  if (from && from.startsWith("/") && !from.startsWith("//")) {
    res.cookies.set(GOOGLE_FROM_COOKIE, from, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });
  }

  return res;
}
