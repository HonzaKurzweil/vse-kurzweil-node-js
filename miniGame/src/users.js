import { renderFile } from "ejs";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { eq } from "drizzle-orm";
import { createNodeWebSocket } from "@hono/node-ws";
import { sendActivePlayers } from "./app.js";

import {
  createUser,
  getUser,
  confirmFriendshipRequest,
  declineFriendRequest,
  fetchFriends,
  findUserByUserName,
  getUserByToken,
  removeFriend,
  sendFriendshipRequest,
} from "./db.js";

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

export const getActiveFriends = async (userId) => {
  if (!userId) return [];
  const friends = await fetchFriends(userId);
  return friends.filter((friend) => activeUsers.has(friend.id));
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

usersRouter.post("/friends/add", async (c) => {
  const form = await c.req.formData();
  const username = form.get("username");
  if (!username) return c.redirect("/friendsPage?error=Neplatné jméno");

  if (username === c.get("user")?.username) {
    return c.redirect(
      "/friendsPage?error=You cannot send a friend request to yourself"
    );
  }

  const receiver = await findUserByUserName(username);
  if (!receiver) return c.redirect("/friendsPage?error=receiver not found");

  const token = getCookie(c, "token");
  const sender = await getUserByToken(token);
  if (!sender) return c.redirect("/login");

  await sendFriendshipRequest(sender.id, receiver.id);
  return c.redirect("/friendsPage");
});

usersRouter.post("/friends/accept/:username", async (c) => {
  const sender = await findUserByUserName(c.req.param("username"));
  if (!sender) return c.redirect("/friendsPage?error=sender not found");
  const token = getCookie(c, "token");
  const receiver = await getUserByToken(token);
  if (!receiver) return c.redirect("/login");
  await confirmFriendshipRequest(sender.id, receiver.id);
  return c.redirect("/friendsPage");
});

usersRouter.post("/friends/decline/:username", async (c) => {
  const sender = await findUserByUserName(c.req.param("username"));
  if (!sender) return c.redirect("/friendsPage?error=sender not found");

  const token = getCookie(c, "token");
  const receiver = await getUserByToken(token);
  if (!receiver) return c.redirect("/login");
  await declineFriendRequest(sender.id, receiver.id);
  return c.redirect("/friendsPage");
});

usersRouter.post("/friends/delete/:username", async (c) => {
  const receiver = await findUserByUserName(c.req.param("username"));
  if (!receiver) return c.redirect("/friendsPage?error=receiver not found");

  const token = getCookie(c, "token");
  const sender = await getUserByToken(token);
  if (!sender) return c.redirect("/login");
  await removeFriend(sender.id, receiver.id);
  return c.redirect("/friendsPage");
});
