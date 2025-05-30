import { Hono } from "hono"
 import { logger } from "hono/logger"
 import { serveStatic } from "@hono/node-server/serve-static"
 import { renderFile } from "ejs"
 import { drizzle } from "drizzle-orm/libsql"
 import { todosTable } from "./schema.js"
 import { eq } from "drizzle-orm"
 import { createNodeWebSocket } from "@hono/node-ws"
 import { WSContext } from "hono/ws"

export const app = new Hono()

export const {injectWebSocket, upgradeWebSocket} = createNodeWebSocket({ app }) 

export const db = drizzle({
    connection:
      process.env.NODE_ENV === "test"
        ? "file::memory:"
        : "file:db.sqlite",
    logger: process.env.NODE_ENV !== "test",
  })

export const getTodoById = async (id) => {
return await db.select()
.from(todosTable)
.where(eq(todosTable.id, id))
.get()
}

/** @type{Set<WsContext<WebSocket>>} */
const connections = new Set()


app.get('/todo/:id/', async (c) => {
    const id = Number(c.req.param('id'))
    const todo = await getTodoById(id)

    if (!todo) return c.notFound()

    const rendered = await renderFile('views/todoDetail.html',  {
        siteTitle: 'Todo Detail',
        todo: todo
    })
    return c.html(rendered)
})

app.get('/', async (c) => {
    const todos = await db.select(
       /* {
        id: todosTable.id,
        title: todosTable.title
    } */
).from(todosTable).all()

    const rendered = await renderFile('views/mainPage.html',  {
        siteTitle: 'My todo app',
        todos
    })
    return c.html(rendered)
})

app.use(serveStatic({root: 'public'}))

app.post('todos', async (c) => {
    const form = await c.req.formData()

    const inserted = await db.insert(todosTable).values({
        title: form.get("title"),
        done: false
    }).returning()

    console.log(inserted)
    sendTodosToAll()
    return c.redirect('/')
})

app.post('changeTitle/:id/', async (c) => {
    const form = await c.req.formData()
    const id = Number(c.req.param('id'))
    await db.update(todosTable)
        .set({title: form.get('newTitle')})
        .where(eq(todosTable.id, id))
    
    sendTodosToAll()
    sendTodoDetailToAllConnections(id)
    
    return c.redirect('/todo/' + id + "/")
})

app.post('changePriority/:id/', async (c) => {
    const form = await c.req.formData()
    const id = Number(c.req.param('id'))
    await db.update(todosTable)
        .set({priority: form.get('newPriority')})
        .where(eq(todosTable.id, id))
    
    sendTodosToAll()
    sendTodoDetailToAllConnections(id)
    
    return c.redirect('/todo/' + id + "/")

})

app.get('/todos/:id/toggle', async (c) => {
    const id = Number(c.req.param('id'))
    const todo = await getTodoById(id)
    
    if (!todo) return c.notFound()
    
    await db.update(todosTable)
        .set({done: !todo.done})
            .where(eq(todosTable.id, id))

    sendTodosToAll()
    sendTodoDetailToAllConnections(id)

    // return c.redicrect(c.req.header("Referer"))
    const redirectTo = c.req.query('redirectTo') || '/'
    return c.redirect(redirectTo)
})

app.get('/todos/:id/remove', async (c) => {
    const id = Number(c.req.param('id'))
    console.log(id)
    await db.delete(todosTable).where(eq(todosTable.id, id))
    sendTodosToAll()
    sendTodoDeletedToAllConnections(id)
    return c.redirect('/')
})

app.get("/ws", upgradeWebSocket((c) => {
    console.log(c.req.path)
    return {
        onOpen: (event, ws) => {
            connections.add(ws)
            console.log("open")
        },
        onClose: (event, ws) => {
            connections.delete(ws)
            console.log("closed")
        },
        onMessage: (event, ws) => {
            console.log("msg", event.data)
        }
    }
}))

const sendTodosToAll = async () => {
    const todos = await db.select().from(todosTable).all()
    const rendered = await renderFile("views/_todos.html", {
        todos,
    })

    for (const connection of connections.values()) {
        const data = JSON.stringify({
            type: "todos",
            html: rendered
        })
        connection.send(data)
    }
}

const sendTodoDetailToAllConnections = async (id) => {
    const todo = await getTodoById(id)
  
    const rendered = await renderFile("views/_todo.html", {
      todo,
    })
  
    for (const connection of connections.values()) {
      const data = JSON.stringify({
        type: "todo",
        id,
        html: rendered,
      })
  
      connection.send(data)
    }
  }
  
  const sendTodoDeletedToAllConnections = async (id) => {
    for (const connection of connections.values()) {
      const data = JSON.stringify({
        type: "todoDeleted",
        id,
      })
  
      connection.send(data)
    }
  }
