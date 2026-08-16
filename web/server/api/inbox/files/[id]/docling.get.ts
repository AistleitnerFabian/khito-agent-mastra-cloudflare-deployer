import { findInboxItem } from "@khito/shared/inbox-database";

type DoclingArtifact = {
  document: unknown;
  markdown: string;
  processingTime?: number;
};

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "An inbox item is required." });
  }

  const item = await findInboxItem(useDatabase(event), id);
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: "Inbox item not found." });
  }

  if (item.processingStatus !== "completed" || !item.extractionKey) {
    return {
      processingError: item.processingError,
      processingStatus: item.processingStatus,
    };
  }

  const artifact = await useR2(event).get(item.extractionKey);
  if (!artifact) {
    throw createError({ statusCode: 404, statusMessage: "Docling output not found." });
  }

  const output = await artifact.json<DoclingArtifact>();
  return {
    ...output,
    processingStatus: "completed" as const,
  };
});
