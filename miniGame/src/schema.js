import { sqliteTable, int, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  username: text().notNull().unique(),
  hashedPassword: text().notNull(),
  salt: text().notNull(),
  token: text().notNull(),
  profilePicture: text().notNull().default("dog.png"),
});
