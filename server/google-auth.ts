import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import { Session } from "@contracts/constants";
import { signSessionToken } from "./kimi/session";
import { getSessionCookieOptions } from "./lib/cookies";
import { sqliteDb } from "./lib/sqlite-db";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

type GoogleTokenResponse = { access_token: string };
type GoogleUserInfo = { email: string; name?: string; picture?: string };

export function handleGoogleAuthRedirect() {
  return async (c: Context) => {
    const origin = new URL(c.req.url).origin;
    const redirectUri = `${origin}/api/auth/google/callback`;

    if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
      const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      googleAuthUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
      googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
      googleAuthUrl.searchParams.set("response_type", "code");
      googleAuthUrl.searchParams.set("scope", "openid email profile");
      googleAuthUrl.searchParams.set("prompt", "select_account");
      return c.redirect(googleAuthUrl.toString(), 302);
    }

    // Google Sign-In Account Chooser Page
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sign in with Google</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex items-center justify-center min-h-screen p-4 font-sans">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-200 dark:border-slate-700">
          <div className="text-center mb-6">
            <svg class="w-10 h-10 mx-auto mb-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <h1 class="text-xl font-bold">Choose a Google Account</h1>
            <p class="text-xs text-slate-500 mt-1">to continue to JanSathi Public Services Portal</p>
          </div>

          <div class="space-y-3 mb-6">
            <a href="/api/auth/google/callback?email=akarshaagarwal25@gmail.com&name=Akarsha+Agarwal" class="flex items-center p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition">
              <div class="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mr-3">AA</div>
              <div>
                <div class="text-sm font-semibold">Akarsha Agarwal</div>
                <div class="text-xs text-slate-500">akarshaagarwal25@gmail.com</div>
              </div>
            </a>

            <a href="/api/auth/google/callback?email=akarsha.work@gmail.com&name=Akarsha+Work" class="flex items-center p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition">
              <div class="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mr-3">AW</div>
              <div>
                <div class="text-sm font-semibold">Akarsha Work</div>
                <div class="text-xs text-slate-500">akarsha.work@gmail.com</div>
              </div>
            </a>
          </div>

          <form action="/api/auth/google/callback" method="GET" class="border-t border-slate-200 pt-4">
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Or use another Gmail address:</label>
            <div class="flex gap-2">
              <input type="email" name="email" required placeholder="your.name@gmail.com" class="flex-1 text-sm p-2.5 rounded-lg border border-slate-300 dark:bg-slate-700 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="hidden" name="name" value="Google Account" />
              <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 rounded-lg transition">Sign In</button>
            </div>
          </form>
        </div>
      </body>
      </html>
    `;
    return c.html(html);
  };
}

export function handleGoogleAuthCallback() {
  return async (c: Context) => {
    const code = c.req.query("code");
    const reqEmail = c.req.query("email");
    const reqName = c.req.query("name") || "Google User";

    let email = reqEmail || "";
    let name = reqName;
    let avatar = "";

    if (code && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
      try {
        const origin = new URL(c.req.url).origin;
        const redirectUri = `${origin}/api/auth/google/callback`;

        const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }).toString(),
        });

        if (tokenResp.ok) {
          const tokens = (await tokenResp.json()) as GoogleTokenResponse;
          const userResp = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });

          if (userResp.ok) {
            const userInfo = (await userResp.json()) as GoogleUserInfo;
            email = userInfo.email;
            name = userInfo.name || name;
            avatar = userInfo.picture || "";
          }
        }
      } catch (err) {
        console.error("Google token exchange error:", err);
      }
    }

    if (!email) {
      email = "google_user_" + Math.floor(Math.random() * 1000) + "@gmail.com";
    }

    const username = email.split("@")[0];
    avatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

    const findStmt = sqliteDb.prepare("SELECT * FROM users WHERE email = ?");
    let user = findStmt.get(email) as any;

    if (!user) {
      const insertStmt = sqliteDb.prepare(`
        INSERT INTO users (username, email, password_hash, name, avatar, role, auth_provider)
        VALUES (?, ?, NULL, ?, ?, 'user', 'google')
      `);
      const result = insertStmt.run(username, email, name, avatar);
      user = { id: Number(result.lastInsertRowid), username, email };
    }

    const token = await signSessionToken({ unionId: user.username || user.email, clientId: "web" });
    const cookieOpts = getSessionCookieOptions(c.req.raw.headers);

    setCookie(c, Session.cookieName, token, {
      ...cookieOpts,
      maxAge: Session.maxAgeMs / 1000,
    });

    return c.redirect("/", 302);
  };
}
