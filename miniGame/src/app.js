import { Hono } from "hono"
 import { renderFile } from "ejs"
import { serveStatic } from "@hono/node-server/serve-static"


export const app = new Hono()

app.get('/', async (c) => {
    
    const rendered = await renderFile('views/mainPage.html',  {
    })
    return c.html(rendered)
})

app.use('/profile_pics/*', serveStatic({ root: './' }))
app.use('/styles.css', serveStatic({ root: './' }))