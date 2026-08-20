import { createDocumentsDatabaseView } from "@khito/shared/documents-database";
import { createInboxDatabase } from "@khito/shared/inbox-database";
import type { InboxProcessingMessage } from "@khito/shared/inbox";
import { classifyDocument } from "../../worker/document-classifier";
import { extractDocumentData } from "../../worker/document-extractor";
import { processDocumentExtraction } from "../../worker/document-processing";
import { extractWithDocling } from "../../worker/docling-client";
import { processInboxItem } from "../../worker/process-inbox-item";

const localDoclingOrigin = "http://localhost:5001";
export const localAgentOrigin = "http://localhost:4111";
export const localNetworkFetcher = { fetch: (input: string, init?: RequestInit) => fetch(input, init) };

export async function processMessageLocally(environment: Cloudflare.Env, message: InboxProcessingMessage) {
  try {
    if ("inboxItemId" in message) {
      await processInboxItemLocally(environment, message.inboxItemId);
      return;
    }

    await processDocumentExtractionLocally(environment, message.documentId);
  }
  catch {
    // The processors have already recorded the failure on the item or document.
  }
}

async function processInboxItemLocally(environment: Cloudflare.Env, inboxItemId: string) {
  await processInboxItem({ inboxItemId }, {
    database: createInboxDatabase(environment.DATABASE),
    inboxFiles: environment.INBOX_FILES,
    convertDocument: source => withLocalServiceError("Docling service", localDoclingOrigin, () => extractWithDocling(source, localNetworkFetcher, localDoclingOrigin)),
    classifyDocument: source => withLocalServiceError("agent", localAgentOrigin, () => classifyDocument(source, localNetworkFetcher, localAgentOrigin)),
  });
}

async function processDocumentExtractionLocally(environment: Cloudflare.Env, documentId: string) {
  await processDocumentExtraction(documentId, {
    documents: createDocumentsDatabaseView(environment.DATABASE),
    inbox: createInboxDatabase(environment.DATABASE),
    inboxFiles: environment.INBOX_FILES,
    extractData: source => withLocalServiceError("agent", localAgentOrigin, () => extractDocumentData(source, localNetworkFetcher, localAgentOrigin)),
  });
}

async function withLocalServiceError<T>(service: string, origin: string, runService: () => Promise<T>) {
  try {
    return await runService();
  }
  catch (error) {
    throw new Error(`The local ${service} at ${origin} failed: ${error instanceof Error ? error.message : "unknown error"}`, { cause: error });
  }
}