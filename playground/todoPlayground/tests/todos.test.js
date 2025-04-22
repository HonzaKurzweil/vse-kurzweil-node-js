
import test from "ava"
import { migrate } from "drizzle-orm/libsql/migrator"
import { db, getTodoById } from "../src/app.js"
import { todosTable } from "../src/schema.js"

test.before("run migrations", async () => {
  await migrate(db, { migrationsFolder: "drizzle" })
})

test("getTodoById returns id", async (t) => {
  await db
    .insert(todosTable)
    .values({ id: 1, title: "testovaci todo", done: false })

  const todo = await getTodoById(1)

  t.is(todo.title, "testovaci todo")
})