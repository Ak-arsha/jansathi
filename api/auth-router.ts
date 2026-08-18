import { z } from "zod";
import bcrypt from "bcryptjs";
import * as cookie from "cookie";
import { TRPCError } from "@trpc/server";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, publicQuery } from "./middleware";
import { signSessionToken } from "./kimi/session";
import { sqliteDb } from "./lib/sqlite-db";

const signupInput = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(6),
  name: z.string().min(2),
});

const loginInput = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(1),
});

const googleLoginInput = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  avatar: z.string().optional(),
});

function setSessionCookie(ctx: any, unionId: string) {
  return signSessionToken({ unionId, clientId: "web" }).then((token) => {
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
  });
}

export const authRouter = createRouter({
  me: publicQuery.query((opts) => opts.ctx.user ?? null),

  signup: publicQuery.input(signupInput).mutation(async ({ ctx, input }) => {
    const checkStmt = sqliteDb.prepare("SELECT * FROM users WHERE username = ? OR email = ?");
    const existing = checkStmt.get(input.username, input.email);
    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "An account with this email or username already exists.",
      });
    }

    const passwordHash = bcrypt.hashSync(input.password, 10);
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${input.username}`;

    const insertStmt = sqliteDb.prepare(`
      INSERT INTO users (username, email, password_hash, name, avatar, role, auth_provider)
      VALUES (?, ?, ?, ?, ?, 'user', 'local')
    `);
    const result = insertStmt.run(input.username, input.email, passwordHash, input.name, avatar);
    const userId = Number(result.lastInsertRowid);

    await setSessionCookie(ctx, input.username);

    return {
      id: userId,
      unionId: input.username,
      name: input.name,
      email: input.email,
      avatar,
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignInAt: new Date(),
    };
  }),

  login: publicQuery.input(loginInput).mutation(async ({ ctx, input }) => {
    const findStmt = sqliteDb.prepare("SELECT * FROM users WHERE username = ? OR email = ?");
    const user = findStmt.get(input.emailOrUsername, input.emailOrUsername) as any;

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invalid email/username or password.",
      });
    }

    if (user.auth_provider === "google" && !user.password_hash) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This account uses Google Sign In. Please sign in with Google.",
      });
    }

    const validPassword = bcrypt.compareSync(input.password, user.password_hash);
    if (!validPassword) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email/username or password.",
      });
    }

    await setSessionCookie(ctx, user.username || user.email);

    return {
      id: user.id,
      unionId: user.username || user.email,
      name: user.name,
      email: user.email,
      avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`,
      role: user.role as "user" | "admin",
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.created_at),
      lastSignInAt: new Date(user.created_at),
    };
  }),

  googleLogin: publicQuery.input(googleLoginInput).mutation(async ({ ctx, input }) => {
    const findStmt = sqliteDb.prepare("SELECT * FROM users WHERE email = ?");
    let user = findStmt.get(input.email) as any;

    if (!user) {
      const username = input.email.split("@")[0] + "_" + Math.floor(Math.random() * 1000);
      const avatar = input.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
      const insertStmt = sqliteDb.prepare(`
        INSERT INTO users (username, email, password_hash, name, avatar, role, auth_provider)
        VALUES (?, ?, NULL, ?, ?, 'user', 'google')
      `);
      const result = insertStmt.run(username, input.email, input.name, avatar);
      user = {
        id: Number(result.lastInsertRowid),
        username,
        email: input.email,
        name: input.name,
        avatar,
        role: "user",
        created_at: new Date().toISOString(),
      };
    }

    await setSessionCookie(ctx, user.username || user.email);

    return {
      id: user.id,
      unionId: user.username || user.email,
      name: user.name,
      email: user.email,
      avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`,
      role: user.role as "user" | "admin",
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.created_at),
      lastSignInAt: new Date(user.created_at),
    };
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
