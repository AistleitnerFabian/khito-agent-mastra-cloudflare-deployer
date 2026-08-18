import { getContainer } from "@cloudflare/containers";
import { createInboxExtractionKey, type InboxProcessingMessage } from "@khito/shared/inbox";
import {
  completeInboxItemProcessing,
  createInboxDatabase,
  failInboxItemProcessing,
  findInboxItem,
  markInboxItemProcessing,
} from "@khito/shared/inbox-database";
import type { DoclingExtraction } from "./docling-container";

type ProcessingEnvironment = Pick<Cloudflare.Env, "DATABASE" | "DOCLING_CONTAINER" | "INBOX_FILES">;

function toExtractionArtifact(extraction: DoclingExtraction) {
  return JSON.stringify({
    document: extraction.document,
    markdown: extraction.markdown,
    processingTime: extraction.processingTime,
  });
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Docling extraction failed.";
}

export async function processInboxItem(message: InboxProcessingMessage, environment: ProcessingEnvironment) {
  const database = createInboxDatabase(environment.DATABASE);
  const item = await findInboxItem(database, message.inboxItemId);

  if (!item || item.processingStatus === "completed") {
    return;
  }

  await markInboxItemProcessing(database, item.id);

  try {
    const container = getContainer(environment.DOCLING_CONTAINER, item.id);
    const source = await environment.INBOX_FILES.get(item.sourceKey);
    if (!source) {
      throw new Error("The inbox source file could not be found.");
    }

    const extraction = await container.extract({
      bytes: await source.arrayBuffer(),
      contentType: item.contentType,
      name: item.name,
    });
    const extractionKey = createInboxExtractionKey(item.id);

    await environment.INBOX_FILES.put(extractionKey, toExtractionArtifact(extraction), {
      httpMetadata: { contentType: "application/json" },
    });
    await completeInboxItemProcessing(database, item.id, extractionKey);
  }
  catch (error) {
    await failInboxItemProcessing(database, item.id, toErrorMessage(error));
    throw error;
  }
}
