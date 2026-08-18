import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export const MOCK_DEV_USER: User = {
  id: 1,
  unionId: "dev-user-akarsha",
  name: "Akarsha Agarwal",
  email: "akarshaagarwal25@gmail.com",
  avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Akarsha",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignInAt: new Date(),
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    ctx.user = MOCK_DEV_USER;
  }
  return ctx;
}
