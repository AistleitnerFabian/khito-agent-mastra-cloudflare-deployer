import { createInboxItem, deleteInboxItem } from "@khito/shared/inbox-database";

const maximumFileSize = 25 * 1024 * 1024;

export default defineEventHandler(async (event) => {
  const formData = await readFormData(event);
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw createError({ statusCode: 400, statusMessage: "Choose a file to upload." });
  }

  if (file.size === 0) {
    throw createError({ statusCode: 400, statusMessage: "The file is empty." });
  }

  if (file.size > maximumFileSize) {
    throw createError({ statusCode: 413, statusMessage: "The file is too large to upload." });
  }

  const bucket = useR2(event);
  const contentType = file.type || "application/octet-stream";
  const storedFile = await bucket.put(createInboxFileKey(file.name), await file.arrayBuffer(), {
    httpMetadata: {
      contentType,
    },
    customMetadata: {
      originalName: file.name,
    },
  });

  if (!storedFile) {
    throw createError({ statusCode: 500, statusMessage: "The file could not be stored." });
  }

  const inboxItem = {
    id: crypto.randomUUID(),
    sourceType: "file_upload" as const,
    sourceKey: storedFile.key,
    name: file.name,
    contentType,
    size: file.size,
    processingStatus: "pending" as const,
    documentType: null,
    documentId: null,
    receivedAt: storedFile.uploaded.toISOString(),
  };

  try {
    await createInboxItem(useDatabase(event), inboxItem);
    await dispatchInboxProcessing(event.context.cloudflare.env, { inboxItemId: inboxItem.id });
  }
  catch (error) {
    await deleteInboxItem(useDatabase(event), inboxItem.id);
    await bucket.delete(storedFile.key);
    throw error;
  }

  return toInboxFile(inboxItem);
});
