import { createInboxExtractionKey, type DocumentType, type InboxProcessingMessage } from "@khito/shared/inbox";
import {
  completeInboxItemProcessing,
  failInboxItemProcessing,
  findInboxItem,
  type InboxDatabase,
  markInboxItemProcessing,
} from "@khito/shared/inbox-database";
import type { ClassificationSource } from "./document-classifier";
import type { DoclingExtraction, DoclingSource } from "./docling-client";

export type InboxProcessingServices = {
  database: InboxDatabase;
  inboxFiles: R2Bucket;
  convertDocument: (source: DoclingSource) => Promise<DoclingExtraction>;
  classifyDocument: (source: ClassificationSource) => Promise<DocumentType>;
};

function toExtractionArtifact(extraction: DoclingExtraction) {
  return JSON.stringify({
    document: extraction.document,
    markdown: extraction.markdown,
    processingTime: extraction.processingTime,
  });
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The inbox item could not be processed.";
}

export async function processInboxItem(message: InboxProcessingMessage, services: InboxProcessingServices) {
  const item = await findInboxItem(services.database, message.inboxItemId);

  if (!item || item.processingStatus === "completed") {
    return;
  }

  await markInboxItemProcessing(services.database, item.id);

  try {
    const source = await services.inboxFiles.get(item.sourceKey);
    if (!source) {
      throw new Error("The inbox source file could not be found.");
    }

    const extraction = await services.convertDocument({
      bytes: await source.arrayBuffer(),
      contentType: item.contentType,
      name: item.name,
    });
    const extractionKey = createInboxExtractionKey(item.id);

    await services.inboxFiles.put(extractionKey, toExtractionArtifact(extraction), {
      httpMetadata: { contentType: "application/json" },
    });

    const documentType = await services.classifyDocument({
      markdown: extraction.markdown || JSON.stringify(extraction.document),
      name: item.name,
    });
    await completeInboxItemProcessing(services.database, item.id, extractionKey, documentType);
  }
  catch (error) {
    await failInboxItemProcessing(services.database, item.id, toErrorMessage(error));
    throw error;
  }
}
