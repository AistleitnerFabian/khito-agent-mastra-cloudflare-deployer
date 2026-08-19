import { createInboxDatabase } from "@khito/shared/inbox-database";
import { classifyDocument } from "../../worker/document-classifier";
import { extractWithDocling } from "../../worker/docling-client";
import { processInboxItem } from "../../worker/process-inbox-item";

const localDoclingOrigin = "http://localhost:5001";
const localAgentOrigin = "http://localhost:4111";
const localNetworkFetcher = { fetch: (input: string, init?: RequestInit) => fetch(input, init) };

export async function processInboxItemLocally(environment: Cloudflare.Env, inboxItemId: string) {
  try {
    await processInboxItem({ inboxItemId }, {
      database: createInboxDatabase(environment.DATABASE),
      inboxFiles: environment.INBOX_FILES,
      convertDocument: source => withLocalServiceError("Docling service", localDoclingOrigin, () => extractWithDocling(source, localNetworkFetcher, localDoclingOrigin)),
      classifyDocument: source => withLocalServiceError("agent", localAgentOrigin, () => classifyDocument(source, localNetworkFetcher, localAgentOrigin)),
    });
  }
  catch {
    // processInboxItem has already recorded the failure on the inbox item.
  }
}

async function withLocalServiceError<T>(service: string, origin: string, runService: () => Promise<T>) {
  try {
    return await runService();
  }
  catch (error) {
    throw new Error(`The local ${service} at ${origin} failed: ${error instanceof Error ? error.message : "unknown error"}`, { cause: error });
  }
}
