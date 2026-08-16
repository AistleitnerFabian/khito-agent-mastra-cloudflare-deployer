type CloudflareEvent = {
  context: unknown;
};

export function useR2(event: CloudflareEvent): R2Bucket {
  const context = event.context as {
    cloudflare?: {
      env?: Cloudflare.Env;
    };
  };
  const bucket = context.cloudflare?.env?.INBOX_FILES;

  if (!bucket) {
    throw createError({ statusCode: 503, statusMessage: "R2 storage is not configured." });
  }

  return bucket;
}
