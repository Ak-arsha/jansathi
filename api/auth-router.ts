import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, publicQuery } from "./middleware";
import { MOCK_DEV_USER } from "./context";
import { signSessionToken } from "./kimi/session";
import { env } from "./lib/env";

export const authRouter = createRouter({
  me: publicQuery.query((opts) => opts.ctx.user ?? MOCK_DEV_USER),
  devLogin: publicQuery.mutation(async ({ ctx }) => {
    const token = await signSessionToken({
      unionId: MOCK_DEV_USER.unionId,
      clientId: env.appId || "dev-client",
    });
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, token, {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: (opts.sameSite?.toLowerCase() as "lax" | "none") || "lax",
        secure: opts.secure,
        maxAge: Session.maxAgeMs / 1000,
      }),
    );
    return MOCK_DEV_USER;
  }),
  logout: publicQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: (opts.sameSite?.toLowerCase() as "lax" | "none") || "lax",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),
});
