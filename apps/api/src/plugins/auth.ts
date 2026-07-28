import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@chatcartpro/db";

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET ?? "";

declare module "fastify" {
  interface FastifyRequest {
    auth?: { supabaseUserId: string; tenantId: string; userId: string };
  }
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(input.length + ((4 - (input.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64");
}

/**
 * Verifies a Supabase-issued HS256 JWT locally against SUPABASE_JWT_SECRET
 * (found in Supabase project settings > API > JWT Secret). Avoids a network
 * round-trip per request, which matters for webhook-adjacent endpoints that
 * need to stay fast.
 */
function verifySupabaseJwt(token: string): { sub: string; exp: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signatureB64] = parts;

  const expectedSig = createHmac("sha256", SUPABASE_JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  const providedSig = base64UrlDecode(signatureB64);

  if (expectedSig.length !== providedSig.length || !timingSafeEqual(expectedSig, providedSig)) {
    return null;
  }

  const payload = JSON.parse(base64UrlDecode(payloadB64).toString("utf8"));
  if (typeof payload.exp === "number" && Date.now() / 1000 > payload.exp) {
    return null; // expired
  }
  return { sub: payload.sub, exp: payload.exp };
}

/**
 * Fastify preHandler that verifies the bearer token, resolves it to our
 * app's User/Tenant, and attaches { supabaseUserId, tenantId, userId } to
 * the request. Callers pass this to onRequest/preHandler on routes that
 * need an authenticated tenant, e.g.:
 *   app.get("/campaigns", { preHandler: authenticate }, handler)
 */
export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return reply.code(401).send({ error: "Missing bearer token" });
  }

  const token = authHeader.slice("Bearer ".length);
  const claims = verifySupabaseJwt(token);
  if (!claims) {
    return reply.code(401).send({ error: "Invalid or expired token" });
  }

  const user = await prisma.user.findUnique({ where: { supabaseUserId: claims.sub } });
  if (!user) {
    return reply.code(403).send({ error: "No tenant associated with this account" });
  }

  req.auth = { supabaseUserId: claims.sub, tenantId: user.tenantId, userId: user.id };
}

export async function authPlugin(app: FastifyInstance) {
  app.decorateRequest("auth", undefined);
}
