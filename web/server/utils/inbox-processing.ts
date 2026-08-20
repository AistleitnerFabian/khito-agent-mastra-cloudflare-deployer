import type { InboxProcessingMessage } from "@khito/shared/inbox";

export async function dispatchInboxProcessing(environment: Cloudflare.Env, message: InboxProcessingMessage) {
  if (import.meta.dev) {
    const { processMessageLocally } = await import("./local-inbox-processing");
    void processMessageLocally(environment, message);
    return;
  }

  await environment.INBOX_PROCESSING.send(message);
}
