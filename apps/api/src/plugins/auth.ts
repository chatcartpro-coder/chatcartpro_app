import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { prisma } from "@chatcartpro/db";

const SUPABASE_JWKS_URL = process.env.SUPABASE_JWKS_URL ?? "";

const JWKS = createRemoteJWKSet(new URL(SUPABASE_JWKS_URL));

declare module "fastify" {
  interface FastifyRequest {
    auth?: { supabaseUserId: string; tenantId: string; userId: string };
  }
}

/**
 * Verifies a Supabase-issued JWT against the project's JWKS endpoint
 * (ES256, asymmetric — Supabase's new API key system has no shared HMAC
 * secret). jose caches and rotates keys internally so this doesn't cost
 * a network round-trip per request.
 */
async function verifySupabaseJwt(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWKS);
    if (typeof payload.sub !== "string") return null;
    return { sub: payload.sub };
  } catch {
    return null;
  }
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
  const claims = await verifySupabaseJwt(token);
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
