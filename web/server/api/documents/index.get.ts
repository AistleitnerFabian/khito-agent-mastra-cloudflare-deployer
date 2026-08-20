import { listDocuments } from "@khito/shared/documents-database";

export default defineEventHandler(async (event) => {
  const documents = await listDocuments(useDocuments(event));
  return documents.map(toDocumentListItem);
});
