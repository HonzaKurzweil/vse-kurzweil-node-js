import { Hono } from "hono"
 import { renderFile } from "ejs"
import { serveStatic } from "@hono/node-server/serve-static"
import { usersRouter, onlyForUsers, attachUser } from "./users.js"
import { getCookie } from "hono/cookie"

import {
  getUserByToken,
} from "./db.js"



export const app = new Hono()

app.use(attachUser)


app.get('/', async (c) => {
    
    const rendered = await renderFile('views/index.html',  {
        user: c.get("user")
    })
    return c.html(rendered)
})

app.get('/mainPage', onlyForUsers, async (c) => {
    
    const rendered = await renderFile('views/mainPage.html',  {
    })
    return c.html(rendered)
})

app.get('/unauthorized', async (c) => {
  const rendered = await renderFile('views/unauthorized.html')
  return c.html(rendered, 401)
})

app.use('/profile_pics/*', serveStatic({ root: './' }))
app.use('/styles.css', serveStatic({ root: './' }))


app.route("/", usersRouter)
