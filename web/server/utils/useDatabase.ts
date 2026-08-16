import { createInboxDatabase } from "@khito/shared/inbox-database";

type CloudflareEvent = {
  context: unknown;
};

export function useDatabase(event: CloudflareEvent) {
  const context = event.context as {
    cloudflare?: {
      env?: Cloudflare.Env;
    };
  };
  const database = context.cloudflare?.env?.DATABASE;

  if (!database) {
    throw createError({ statusCode: 503, statusMessage: "Database is not configured." });
  }

  return createInboxDatabase(database);
}
