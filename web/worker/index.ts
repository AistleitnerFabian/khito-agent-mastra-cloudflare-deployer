import type { InboxProcessingMessage } from "@khito/shared/inbox";
import { createInboxDatabase } from "@khito/shared/inbox-database";
import nitroWorker from "../.output/server/index.mjs";
import { classifyDocument } from "./document-classifier";
import { extractWithDocling } from "./docling-client";
import { processInboxItem, type InboxProcessingServices } from "./process-inbox-item";

const doclingOrigin = "http://docling.internal";
const agentOrigin = "https://khito-agent";

function toProcessingServices(environment: Cloudflare.Env): InboxProcessingServices {
  return {
    database: createInboxDatabase(environment.DATABASE),
    inboxFiles: environment.INBOX_FILES,
    convertDocument: source => extractWithDocling(source, environment.DOCLING_PROCESSOR, doclingOrigin),
    classifyDocument: source => classifyDocument(source, environment.KHITO_AGENT, agentOrigin),
  };
}

export default {
  fetch: nitroWorker.fetch,
  async queue(batch: MessageBatch<InboxProcessingMessage>, environment: Cloudflare.Env) {
    const services = toProcessingServices(environment);

    for (const message of batch.messages) {
      try {
        await processInboxItem(message.body, services);
        message.ack();
      }
      catch (error) {
        console.error("Inbox processing failed", {
          inboxItemId: message.body.inboxItemId,
          error,
        });
        message.retry();
      }
    }
  },
} satisfies ExportedHandler<Cloudflare.Env, InboxProcessingMessage>;
