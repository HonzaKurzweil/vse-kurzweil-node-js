import { renderFile } from "ejs"
import { Hono } from "hono"
import { createUser, db, getUser } from "./db.js"
import { setCookie } from "hono/cookie"
import { eq } from "drizzle-orm"

export const usersRouter = new Hono()

const onlyForUsers = async (c, next) => {
  const user = c.get("user")
  if (!user) return c.notFound()
  await next()
}

usersRouter.get("/register", async (c) => {
  const rendered = await renderFile("views/register.html")

  return c.html(rendered)
})

usersRouter.post("/register", async (c) => {
  const form = await c.req.formData()

  const user = await createUser(
    form.get("username"),
    form.get("password")
  )

  setCookie(c, "token", user.token)

  return c.redirect("/")
})

usersRouter.get("/login", async (c) => {
  const rendered = await renderFile("views/login.html")

  return c.html(rendered)
})

usersRouter.post("/login", async (c) => {
  const form = await c.req.formData()

  const user = await getUser(
    form.get("username"),
    form.get("password")
  )

  if (!user) return c.notFound()

  setCookie(c, "token", user.token)

  return c.redirect("/")
})
