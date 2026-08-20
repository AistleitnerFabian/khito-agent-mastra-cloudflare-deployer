import { findDocument, updateDocument } from "@khito/shared/documents-database";
import { isExtractedDocumentData } from "@khito/shared/documents";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "A document is required." });
  }

  const database = useDocuments(event);
  const document = await findDocument(database, id);
  if (!document) {
    throw createError({ statusCode: 404, statusMessage: "Document not found." });
  }

  const changes = await readBody<{ data?: unknown; assignee?: unknown }>(event);

  if (changes.data !== undefined && !isExtractedDocumentData(changes.data)) {
    throw createError({ statusCode: 400, statusMessage: "The document data is invalid." });
  }

  if (changes.assignee !== undefined && typeof changes.assignee !== "string" && changes.assignee !== null) {
    throw createError({ statusCode: 400, statusMessage: "The assignee is invalid." });
  }

  await updateDocument(database, id, {
    ...(changes.data !== undefined ? { data: changes.data } : {}),
    ...(changes.assignee !== undefined ? { assignee: changes.assignee } : {}),
  });

  return toDocumentApi(await findDocument(database, id) ?? document);
});
