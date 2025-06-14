import { Hono } from "hono";
import { renderFile } from "ejs";
import { serveStatic } from "@hono/node-server/serve-static";
import { usersRouter, onlyForUsers, attachUser, activeUsers } from "./users.js";
import { createNodeWebSocket } from "@hono/node-ws";

import {
  confirmFriendshipRequest,
  declineFriendRequest,
  fetchFriendRequests,
  fetchFriends,
  findUserById,
  findUserByUserName,
  getUserByToken,
  removeFriend,
  sendFriendshipRequest,
} from "./db.js";
import { getCookie } from "hono/cookie";

/** @type{Set<WsContext<WebSocket>>} */
const connections = new Set();

export const app = new Hono();
export const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({
  app,
});
export const sendActivePlayers = async () => {
  const players = await Promise.all(
    Array.from(activeUsers).map((id) => findUserById(id))
  );
  const rendered = await renderFile("views/_activePlayers.html", {
    players,
  });

  for (const connection of connections.values()) {
    const data = JSON.stringify({
      type: "activePlayers",
      html: rendered,
    });
    connection.send(data);
  }
};

app.route("/", usersRouter);

app.use("/profile_pics/*", serveStatic({ root: "./" }));
app.use("/styles.css", serveStatic({ root: "./" }));
app.use(attachUser);

app.get("/", async (c) => {
  const rendered = await renderFile("views/index.html", {
    user: c.get("user"),
  });
  return c.html(rendered);
});

app.get("/mainPage", attachUser, onlyForUsers, async (c) => {
  const players = await Promise.all(
    Array.from(activeUsers).map((id) => findUserById(id))
  );
  console.log("active players:", players);
  const rendered = await renderFile("views/mainPage.html", {
    players,
  });
  return c.html(rendered);
});

app.get("/friendsPage", async (c) => {
  const token = getCookie(c, "token");
  const user = await getUserByToken(token);
  if (!user) return c.redirect("/login");

  const friends = await fetchFriends(user.id);
  const friendRequests = await fetchFriendRequests(user.id);
  const error = c.req.query("error");

  const rendered = await renderFile("views/friendsPage.html", {
    friends,
    friendRequests,
    error,
  });
  return c.html(rendered);
});

app.get("/unauthorized", async (c) => {
  const rendered = await renderFile("views/unauthorized.html");
  return c.html(rendered, 401);
});

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    console.log(c.req.path);
    return {
      onOpen: (event, ws) => {
        connections.add(ws);
        console.log("open");
      },
      onClose: (event, ws) => {
        connections.delete(ws);
        console.log("closed");
      },
      onMessage: (event, ws) => {
        console.log("msg", event.data);
      },
    };
  })
);

app.post("/friends/add", async (c) => {
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

app.post("/friends/accept/:username", async (c) => {
  const sender = await findUserByUserName(c.req.param("username"));
  if (!sender) return c.redirect("/friendsPage?error=sender not found");
  const token = getCookie(c, "token");
  const receiver = await getUserByToken(token);
  if (!receiver) return c.redirect("/login");
  await confirmFriendshipRequest(sender.id, receiver.id);
  return c.redirect("/friendsPage");
});

app.post("/friends/decline/:username", async (c) => {
  const sender = await findUserByUserName(c.req.param("username"));
  if (!sender) return c.redirect("/friendsPage?error=sender not found");

  const token = getCookie(c, "token");
  const receiver = await getUserByToken(token);
  if (!receiver) return c.redirect("/login");
  await declineFriendRequest(sender.id, receiver.id);
  return c.redirect("/friendsPage");
});

app.post("/friends/delete/:username", async (c) => {
  const receiver = await findUserByUserName(c.req.param("username"));
  if (!sender) return c.redirect("/friendsPage?error=receiver not found");

  const token = getCookie(c, "token");
  const sender = await getUserByToken(token);
  if (!sender) return c.redirect("/login");
  await removeFriend(sender.id, receiver.id);
  return c.redirect("/friendsPage");
});

//TODO: add imiage selection to registration

//TODO: add image/name/password change to profile page

//TODO: add avatar to friends list

//TODO: make it so only active FRINEDS are seen in Active players
