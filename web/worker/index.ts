import type { InboxProcessingMessage } from "@khito/shared/inbox";
import { createDocumentsDatabaseView } from "@khito/shared/documents-database";
import { createInboxDatabase } from "@khito/shared/inbox-database";
import nitroWorker from "../.output/server/index.mjs";
import { classifyDocument } from "./document-classifier";
import { extractDocumentData, type ExtractionSource } from "./document-extractor";
import { processDocumentExtraction } from "./document-processing";
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

function toDocumentProcessingServices(environment: Cloudflare.Env) {
  return {
    documents: createDocumentsDatabaseView(environment.DATABASE),
    inbox: createInboxDatabase(environment.DATABASE),
    inboxFiles: environment.INBOX_FILES,
    extractData: (source: ExtractionSource) => extractDocumentData(source, environment.KHITO_AGENT, agentOrigin),
  };
}

async function processMessage(message: InboxProcessingMessage, environment: Cloudflare.Env) {
  if ("inboxItemId" in message) {
    await processInboxItem(message, toProcessingServices(environment));
    return;
  }

  await processDocumentExtraction(message.documentId, toDocumentProcessingServices(environment));
}

export default {
  fetch: nitroWorker.fetch,
  async queue(batch: MessageBatch<InboxProcessingMessage>, environment: Cloudflare.Env) {
    for (const message of batch.messages) {
      try {
        await processMessage(message.body, environment);
        message.ack();
      }
      catch (error) {
        console.error("Inbox processing failed", {
          message: message.body,
          error,
        });
        message.retry();
      }
    }
  },
} satisfies ExportedHandler<Cloudflare.Env, InboxProcessingMessage>;
