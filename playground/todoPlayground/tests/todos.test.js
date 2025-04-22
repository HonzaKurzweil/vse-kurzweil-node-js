
import test from "ava"
import { migrate } from "drizzle-orm/libsql/migrator"
import { db, getTodoById, getAllTodos } from "../src/app.js"
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
  t.is(todo.done, false)

})

test("getAllTodos returns inserted todos", async (t) => {
  await db.insert(todosTable).values([
    { id: 2, title: "Todo 1", done: false },
    { id: 3, title: "Todo 2", done: true },
  ])

  const todos = await getAllTodos()

  t.is(todos.length, 3)
  t.deepEqual(todos.map((t) => t.title), ["testovaci todo", "Todo 1", "Todo 2"])
})