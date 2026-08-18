import { ContainerProxy } from "@cloudflare/containers";
import type { InboxProcessingMessage } from "@khito/shared/inbox";
import nitroWorker from "../.output/server/index.mjs";
import { DoclingContainer } from "./docling-container";
import { processInboxItem } from "./process-inbox-item";

export { ContainerProxy, DoclingContainer };

export default {
  fetch: nitroWorker.fetch,
  async queue(batch: MessageBatch<InboxProcessingMessage>, environment: Cloudflare.Env) {
    for (const message of batch.messages) {
      try {
        await processInboxItem(message.body, environment);
        message.ack();
      }
      catch (error) {
        console.error("Inbox Docling extraction failed", {
          inboxItemId: message.body.inboxItemId,
          error,
        });
        message.retry();
      }
    }
  },
} satisfies ExportedHandler<Cloudflare.Env, InboxProcessingMessage>;
