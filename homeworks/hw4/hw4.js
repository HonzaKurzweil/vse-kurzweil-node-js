/*
Do vaší Todo aplikace (můžete vycházet i z mojí verze) vytvořte stránku s detailem jednoho todočka. Tato stránku se bude nacházet pod URL
 /todo/:id a na stránce bude vidět titulek todočka a zda je hotové či ne. Dále zde budou odkazy na změnu stavu todočka, odstránění todočka a formulář 
 na změnu titulku todočka. Na tuto stránku se dostanete kliknutím na titulek todočka na hlavní stránce se seznamem všech todoček.
*/

import { Hono } from 'hono'
import { serve } from  '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { renderFile } from  'ejs'


const app = new Hono()

const todos = [
    {
        id: 1,
        title: 'Tadaaa',
        done: false
    },
    {
        id: 2,
        title: 'heheheh',
        done: false
    }
]

app.get('/todo/:id/', async (c) => {
    const id = Number(c.req.param('id'))
    const todo = todos.find((todo) => todo.id === id)
    if (!todo) return c.notFound()

    const rendered = await renderFile('views/todoDetail.html',  {
        siteTitle: 'Todo Detail',
        todo: todo
    })
    return c.html(rendered)
})

app.get('/', async (c) => {
    const rendered = await renderFile('views/mainPage.html',  {
        siteTitle: 'My todo app',
        todos // = todos: todos
    })
    return c.html(rendered)
})

app.use(serveStatic({root: 'public'}))

app.post('todos', async (c) => {
    const form = await c.req.formData()
    todos.push({
        id: todos.length + 1,
        title: form.get('title'),
        done: false,
    })
    return c.redirect('/')
})

app.post('changeTitle/:id/', async (c) => {
    const form = await c.req.formData()
    const id = Number(c.req.param('id'))
    const todo = todos.find((todo) => todo.id === id)
    if (!todo) return c.notFound()

     todo.title = form.get('newTitle')
    return c.redirect('/todo/' + id + "/")
})

app.get('/todos/:id/toggle', async (c) => {
    const id = Number(c.req.param('id'))
    const todo = todos.find((todo) => todo.id === id)
    if (!todo) return c.notFound()
    todo.done = !todo.done
    const redirectTo = c.req.query('redirectTo') || '/'
    return c.redirect(redirectTo)
})

app.get('/todos/:id/remove', async (c) => {
    const id = Number(c.req.param('id'))
    const index = todos.findIndex((todo => todo.id === id))
    todos.splice(index, 1)

    return c.redirect('/')
})

serve(app,(info) => {
    console.log('App started on http://localhost:' + info.port)
})