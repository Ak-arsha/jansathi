import * as jose from "jose";
import { env } from "../lib/env";
import type { SessionPayload } from "./types";

const JWT_ALG = "HS256";

function getSecret() {
  const secretKey = env.appSecret && env.appSecret.length > 0
    ? env.appSecret
    : "jansathi-secret-key-change-in-production-12345";
  return new TextEncoder().encode(secretKey);
}

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  const secret = getSecret();
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("1 year")
    .sign(secret);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }
  try {
    const secret = getSecret();
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
    });
    const { unionId, clientId } = payload;
    if (!unionId || !clientId) {
      return null;
    }
    return { unionId, clientId } as SessionPayload;
  } catch (error) {
    return null;
  }
}
