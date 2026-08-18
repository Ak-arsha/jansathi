import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { verifySessionToken } from "./kimi/session";
import { sqliteDb } from "./lib/sqlite-db";

export const MOCK_DEV_USER: User = {
  id: 1,
  unionId: "demo-user",
  name: "JanSathi Citizen",
  email: "citizen@jansathi.gov.in",
  avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=jansathi",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignInAt: new Date(),
};

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    const cookies = cookie.parse(opts.req.headers.get("cookie") || "");
    const token = cookies[Session.cookieName];
    if (token) {
      const claim = await verifySessionToken(token);
      if (claim?.unionId) {
        const idNum = Number.isInteger(Number(claim.unionId)) ? Number(claim.unionId) : -1;
        const stmt = sqliteDb.prepare("SELECT * FROM users WHERE username = ? OR email = ? OR id = ?");
        const row = stmt.get(claim.unionId, claim.unionId, idNum) as any;
        if (row) {
          ctx.user = {
            id: row.id,
            unionId: row.username || row.email,
            name: row.name,
            email: row.email,
            avatar: row.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${row.username}`,
            role: row.role as "user" | "admin",
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.created_at),
            lastSignInAt: new Date(row.created_at),
          };
        }
      }
    }
  } catch (err) {
    console.error("[createContext] Error:", err);
  }
  return ctx;
}
