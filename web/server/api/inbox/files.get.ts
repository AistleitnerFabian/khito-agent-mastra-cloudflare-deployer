import { listInboxItems } from "../../repositories/inbox-items";

export default defineEventHandler(async (event) => {
  const items = await listInboxItems(useDatabase(event));
  return items.map(toInboxFile);
});
