import { Hono } from "hono"
 import { renderFile } from "ejs"
import { serveStatic } from "@hono/node-server/serve-static"
import { usersRouter } from "./users.js"
import { getCookie } from "hono/cookie"

import {
  getUserByToken,
} from "./db.js"



export const app = new Hono()

app.get('/', async (c) => {
    
    const rendered = await renderFile('views/index.html',  {
        user: c.get("user")
    })
    return c.html(rendered)
})


app.use('/profile_pics/*', serveStatic({ root: './' }))
app.use('/styles.css', serveStatic({ root: './' }))


app.use(async (c, next) => {
  const token = getCookie(c, "token")
  const user = await getUserByToken(token)
  c.set("user", user)
  await next()
})

app.route("/", usersRouter)
