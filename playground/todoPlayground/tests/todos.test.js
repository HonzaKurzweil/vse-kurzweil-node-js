
import test from "ava"
import { migrate } from "drizzle-orm/libsql/migrator"
import { db, getTodoById, getAllTodos, updateTodo } from "../src/app.js"
import { todosTable } from "../src/schema.js"


test.serial.before("run migrations", async () => {
  await migrate(db, { migrationsFolder: "drizzle" })
})

test.serial("getTodoById returns id", async (t) => {
  await db
    .insert(todosTable)
    .values({ id: 1, title: "testovaci todo", done: false })

  const todo = await getTodoById(1)

  t.is(todo.title, "testovaci todo")
  t.is(todo.done, false)

})

test.serial("getAllTodos returns inserted todos", async (t) => {
  await db.insert(todosTable).values([
    { id: 2, title: "Todo 1", done: false },
    { id: 3, title: "Todo 2", done: true },
  ])

  const todos = await getAllTodos()

  t.is(todos.length, 3)
  t.deepEqual(todos.map((t) => t.title), ["testovaci todo", "Todo 1", "Todo 2"])
})

test.serial("updateTodo returns updated todo", async (t) => {
  await updateTodo(1, {title:"zmena1"})
  const todo1 = await getTodoById(1)
  t.is(todo1.title, "zmena1")
  t.is(todo1.done, false)
  t.is(todo1.priority, "normal")


  await updateTodo(2, {title:"zmena2", done:true, priority: "high"})
  const todo2 = await getTodoById(2)
  t.is(todo2.title, "zmena2")
  t.is(todo2.done, true)
  t.is(todo2.priority, "high")
 
})