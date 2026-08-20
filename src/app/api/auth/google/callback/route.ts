import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  GOOGLE_FROM_COOKIE,
  GOOGLE_STATE_COOKIE,
  exchangeGoogleCode,
  fetchGoogleProfile,
  getAppUrl,
  isGoogleAuthConfigured,
} from "@/lib/auth/google";
import { findOrCreateGoogleUser } from "@/lib/auth/google-user";
import { createSession, getDashboardPath, setSessionCookie } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const loginUrl = new URL("/login", getAppUrl());

  if (!isGoogleAuthConfigured()) {
    loginUrl.searchParams.set("error", "google_not_configured");
    return NextResponse.redirect(loginUrl);
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    loginUrl.searchParams.set("error", "google_denied");
    return NextResponse.redirect(loginUrl);
  }

  if (!code || !state) {
    loginUrl.searchParams.set("error", "google_invalid");
    return NextResponse.redirect(loginUrl);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get(GOOGLE_STATE_COOKIE)?.value;
  const from = cookieStore.get(GOOGLE_FROM_COOKIE)?.value;

  if (!savedState || savedState !== state) {
    loginUrl.searchParams.set("error", "google_state");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const accessToken = await exchangeGoogleCode(code);
    const profile = await fetchGoogleProfile(accessToken);
    const user = await findOrCreateGoogleUser(profile);

    const { token, expiresAt } = await createSession(user.id);
    await setSessionCookie(token, expiresAt);

    const hasRestaurant =
      user.role === "RESTAURANT_ADMIN" ? user.memberships.length > 0 : true;
    const redirectTo =
      from && from.startsWith("/") && !from.startsWith("//")
        ? from
        : getDashboardPath(user.role, hasRestaurant);

    const res = NextResponse.redirect(new URL(redirectTo, getAppUrl()));
    res.cookies.delete(GOOGLE_STATE_COOKIE);
    res.cookies.delete(GOOGLE_FROM_COOKIE);
    return res;
  } catch (err) {
    loginUrl.searchParams.set(
      "error",
      err instanceof Error ? err.message.slice(0, 120) : "google_failed"
    );
    return NextResponse.redirect(loginUrl);
  }
}
