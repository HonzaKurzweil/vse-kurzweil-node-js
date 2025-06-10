import crypto from "crypto";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/libsql/migrator";
import { usersTable } from "./schema.js";

const isTest = process.env.NODE_ENV === "test";

export const db = drizzle({
  connection: isTest ? "file::memory:" : "file:db.sqlite",
  logger: !isTest,
});

await migrate(db, { migrationsFolder: "drizzle" });

export const createUser = async (username, password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hashedPassword = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  const token = crypto.randomBytes(16).toString("hex");

  const user = await db
    .insert(usersTable)
    .values({
      username,
      hashedPassword,
      token,
      salt,
    })
    .returning(usersTable)
    .get();

  return user;
};

export const getUser = async (username, password) => {
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .get();

  if (!user) return null;

  const hashedPassword = crypto
    .pbkdf2Sync(password, user.salt, 100000, 64, "sha512")
    .toString("hex");

  if (user.hashedPassword !== hashedPassword) return null;

  return user;
};

export const getUserByToken = async (token) => {
  if (!token) return null;

  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.token, token))
    .get();

  return user;
};

export const findUserById = async (id) => {
  if (!id) return null;
  return await db.select().from(usersTable).where(eq(usersTable.id, id)).get();
};
