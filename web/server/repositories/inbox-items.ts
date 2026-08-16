import { desc } from "drizzle-orm";
import { inboxItems } from "../database/schema";
import type { Database } from "../utils/database";

export type InboxItem = typeof inboxItems.$inferSelect;

type NewInboxItem = typeof inboxItems.$inferInsert;

export function listInboxItems(database: Database) {
  return database.select().from(inboxItems).orderBy(desc(inboxItems.createdAt)).all();
}

export async function createInboxItem(database: Database, item: NewInboxItem) {
  await database.insert(inboxItems).values(item).run();
  return item;
}
