import Fastify from "fastify";
import { webhookRoutes } from "./routes/webhooks.js";
import { authPlugin, authenticate } from "./plugins/auth.js";

declare module "fastify" {
  interface FastifyRequest {
    rawBody?: string;
  }
}

const app = Fastify({ logger: true });

// Capture the raw request body before JSON parsing so webhook signature
// verification (HMAC over exact bytes) has something to check against.
app.addContentTypeParser(
  "application/json",
  { parseAs: "string" },
  (req, body, done) => {
    req.rawBody = body as string;
    try {
      const json = body.length ? JSON.parse(body as string) : {};
      done(null, json);
    } catch (err) {
      done(err as Error, undefined);
    }
  },
);

app.get("/health", async () => ({ status: "ok" }));

await app.register(authPlugin);

// Example of a tenant-scoped protected route; future API routes (contacts,
// campaigns, etc.) should follow this pattern.
app.get("/me", { preHandler: authenticate }, async (req) => {
  return { tenantId: req.auth!.tenantId, userId: req.auth!.userId };
});

await app.register(webhookRoutes);

const port = Number(process.env.PORT ?? 8080);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
