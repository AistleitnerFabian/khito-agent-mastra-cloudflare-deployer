import type { DocumentBounds } from "@khito/shared/documents";
import { completeDocumentExtraction, failDocumentExtraction, findDocument, type DocumentsDatabase } from "@khito/shared/documents-database";
import { findInboxItem, type InboxDatabase } from "@khito/shared/inbox-database";
import { locateDocumentBounds } from "./bounding-boxes";
import type { DocumentExtraction, ExtractionSource } from "./document-extractor";

export type DocumentProcessingServices = {
  documents: DocumentsDatabase;
  inbox: InboxDatabase;
  inboxFiles: R2Bucket;
  extractData: (source: ExtractionSource) => Promise<DocumentExtraction>;
};

type DoclingArtifact = {
  document?: unknown;
  markdown?: string;
};

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The document could not be extracted.";
}

export async function processDocumentExtraction(documentId: string, services: DocumentProcessingServices) {
  const document = await findDocument(services.documents, documentId);

  if (!document || document.extractionStatus !== "extracting") {
    return;
  }

  try {
    const item = await findInboxItem(services.inbox, document.inboxItemId);
    if (!item?.extractionKey) {
      throw new Error("The inbox item has no completed Docling extraction.");
    }

    const artifactFile = await services.inboxFiles.get(item.extractionKey);
    if (!artifactFile) {
      throw new Error("The Docling output could not be loaded.");
    }

    const artifact = await artifactFile.json<DoclingArtifact>();
    const extraction = await services.extractData({
      markdown: artifact.markdown || JSON.stringify(artifact.document),
      name: document.name,
      documentType: document.documentType,
    });

    const bounds: DocumentBounds = locateDocumentBounds(artifact.document, extraction.sources);
    await completeDocumentExtraction(services.documents, documentId, extraction.data, bounds, toPageCount(artifact.document));
  }
  catch (error) {
    await failDocumentExtraction(services.documents, documentId, toErrorMessage(error));
    throw error;
  }
}

function toPageCount(doclingDocument: unknown) {
  if (typeof doclingDocument !== "object" || doclingDocument === null) {
    return 1;
  }

  const pages = (doclingDocument as { pages?: Record<string, unknown> }).pages;
  return Math.max(1, Object.keys(pages ?? {}).length);
}
