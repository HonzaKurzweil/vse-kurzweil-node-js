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


app.get('/', async (c) => {
    const rendered = await renderFile('views/index.html',  {
        title: 'My todo app',
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

app.get('/todos/:id/toggle', async (c) => {
    const id = Number(c.req.param('id'))
    const todo = todos.find((todo) => todo.id === id)
    todo.done = !todo.done
    if (!todo) return c.notFound()
    return c.redirect('/')
})

app.get('/todos/:id/remove', async (c) => {
    const id = Number(c.req.param('id'))
    const index = todos.findIndex((todo => todo.id === id))
    todos.splice(index, 1)

    return c.redirect('/')
})

/*

app.get('/', (c) => {
    return c.html('<h1>Hello </h1>)')
})



app.get('/', (c) => {
    return c.text('Hello :)')
})

app.use('/greeting', (c) => {
    return c.text(zdravim)
})


ServiceWorkerRegistration(app, (info) => {
    console.log('App started on http://localhost:' + info.port)
})

    */

serve(app,(info) => {
    console.log('App started on http://localhost:' + info.port)
})