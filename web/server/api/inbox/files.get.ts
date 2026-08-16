import { listInboxItems } from "@khito/shared/inbox-database";

export default defineEventHandler(async (event) => {
  const items = await listInboxItems(useDatabase(event));
  return items.map(toInboxFile);
});
