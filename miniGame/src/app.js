import { Hono } from "hono";
import { renderFile } from "ejs";
import { serveStatic } from "@hono/node-server/serve-static";
import { usersRouter, onlyForUsers, attachUser, activeUsers } from "./users.js";
import { createNodeWebSocket } from "@hono/node-ws";

import { findUserById, getUserByToken } from "./db.js";

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
