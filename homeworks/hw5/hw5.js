/*
Do vaší Todo aplikace přidejte novou migraci přidávající nový sloupeček do tabulky todos - například priority, enum (výčet možností) s možnostmi normal, 
low a high. Pozor, neupravujte stávající migraci. Zároveň tento nový sloupeček nějak zobrazte na seznamu todoček, na detailu todočka a umožňěte ho upravovat 
z detailu todočka (buďto pomocí nového formuláře nebo rozšiřte již existující formulář na úpravu titulku).
*/

import { Hono } from 'hono'
import { serve } from  '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { renderFile } from  'ejs'
import { drizzle } from 'drizzle-orm/libsql'
import { todosTable } from './src/schema.js'
import { eq } from 'drizzle-orm'


const app = new Hono()

const db = drizzle({connection: "file:db.sqlite", 
                    logger: true
})

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
    return c.redirect('/')
})

app.post('changeTitle/:id/', async (c) => {
    const form = await c.req.formData()
    const id = Number(c.req.param('id'))
    await db.update(todosTable)
        .set({title: form.get('newTitle')})
        .where(eq(todosTable.id, id))
    return c.redirect('/todo/' + id + "/")
})

app.get('/todos/:id/toggle', async (c) => {
    const id = Number(c.req.param('id'))
    const todo = await getTodoById(id)
    
    if (!todo) return c.notFound()
    
    await db.update(todosTable)
        .set({done: !todo.done})
            .where(eq(todosTable.id, id))


    // return c.redicrect(c.req.header("Referer"))
    const redirectTo = c.req.query('redirectTo') || '/'
    return c.redirect(redirectTo)
})

app.get('/todos/:id/remove', async (c) => {
    const id = Number(c.req.param('id'))
    console.log(id)
    await db.delete(todosTable).where(eq(todosTable.id, id))

    return c.redirect('/')
})

const getTodoById = async (id) => {
    return await db.select()
        .from(todosTable)
        .where(eq(todosTable.id, id))
        .get()
}

serve(app,(info) => {
    console.log('App started on http://localhost:' + info.port)
})