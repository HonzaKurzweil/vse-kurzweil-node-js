import { Hono } from "hono"
 import { renderFile } from "ejs"



export const app = new Hono()

app.get('/', async (c) => {
    
    const rendered = await renderFile('views/login.html',  {
    })
    return c.html(rendered)
})
