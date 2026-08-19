import type { InboxProcessingMessage } from "@khito/shared/inbox";

export async function dispatchInboxProcessing(environment: Cloudflare.Env, inboxItemId: string) {
  if (import.meta.dev) {
    const { processInboxItemLocally } = await import("./local-inbox-processing");
    void processInboxItemLocally(environment, inboxItemId);
    return;
  }

  await environment.INBOX_PROCESSING.send({ inboxItemId } satisfies InboxProcessingMessage);
}
