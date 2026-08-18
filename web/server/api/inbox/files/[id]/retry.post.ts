import type { InboxProcessingMessage } from "@khito/shared/inbox";
import { findInboxItem, retryInboxItemProcessing } from "@khito/shared/inbox-database";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "An inbox item is required." });
  }

  const database = useDatabase(event);
  const item = await findInboxItem(database, id);
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: "Inbox item not found." });
  }

  if (item.processingStatus !== "failed") {
    throw createError({ statusCode: 409, statusMessage: "Only failed Docling extractions can be retried." });
  }

  await retryInboxItemProcessing(database, id);
  await event.context.cloudflare.env.INBOX_PROCESSING.send({ inboxItemId: id } satisfies InboxProcessingMessage);

  return { processingStatus: "pending" as const };
});
