import { renderFile } from "ejs";
import { Hono } from "hono";
import { createUser, db, findUserById, getUser } from "./db.js";
import { getCookie, setCookie } from "hono/cookie";
import { eq } from "drizzle-orm";
import { getUserByToken } from "./db.js";
import { createNodeWebSocket } from "@hono/node-ws";
import { sendActivePlayers } from "./app.js";

export const usersRouter = new Hono();

export const activeUsers = new Set();

export const onlyForUsers = async (c, next) => {
  const user = c.get("user");
  if (!user) return c.redirect("/unauthorized");
  await next();
};

export const attachUser = async (c, next) => {
  const token = getCookie(c, "token");
  const user = await getUserByToken(token);

  // maybe I need to check if the user is in the activeUsers set as well?
  c.set("user", user);
  await next();
};

usersRouter.use(attachUser);

usersRouter.get("/register", async (c) => {
  const rendered = await renderFile("views/register.html");

  return c.html(rendered);
});

usersRouter.get("/logout", async (c) => {
  const user = c.get("user");
  console.log("user to delete", user);
  if (user) {
    activeUsers.delete(user.id);
  }
  setCookie(c, "token", "");
  await sendActivePlayers();
  return c.redirect("/");
});

usersRouter.post("/register", async (c) => {
  const form = await c.req.formData();

  const user = await createUser(
    form.get("username"),
    form.get("password"),
    form.get("profilePicture")
  );

  setCookie(c, "token", user.token);
  activeUsers.add(user.id);
  await sendActivePlayers();
  return c.redirect("/mainPage");
});

usersRouter.get("/login", async (c) => {
  const error = c.req.query("error");
  const rendered = await renderFile("views/login.html", { error });
  return c.html(rendered);
});

usersRouter.post("/login", async (c) => {
  const form = await c.req.formData();
  const user = await getUser(form.get("username"), form.get("password"));
  if (!user) {
    return c.redirect("/login?error=Incorrect username or password");
  }
  setCookie(c, "token", user.token);
  activeUsers.add(user.id);
  await sendActivePlayers();
  return c.redirect("/mainPage");
});
