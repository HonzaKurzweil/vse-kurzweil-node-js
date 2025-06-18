import { Hono } from "hono";
import { renderFile } from "ejs";
import { serveStatic } from "@hono/node-server/serve-static";
import {
  usersRouter,
  onlyForUsers,
  attachUser,
  activeUsers,
  getActiveFriends,
} from "./users.js";
import { createNodeWebSocket } from "@hono/node-ws";

import {
  fetchFriendRequests,
  fetchFriends,
  findUserById,
  getUserByToken,
} from "./db.js";
import { getCookie } from "hono/cookie";
import {
  clickOnSignalGame,
  getGameRequests,
} from "./games/clickOnSignalGame.js";

export const connections = new Map();

export const app = new Hono();
export const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({
  app,
});

export const sendActivePlayers = async () => {
  for (const [ws, userId] of connections.entries()) {
    const activeFriends = await getActiveFriends(userId);
    const renderedctiveFriends = await renderFile("views/_activePlayers.html", {
      players: activeFriends,
    });

    const renderedGameRequest = await renderFile(
      "views/_sendGameRequest.html",
      {
        players: activeFriends,
      }
    );
    ws.send(
      JSON.stringify({
        type: "activePlayers",
        html: renderedctiveFriends,
      })
    );
    ws.send(
      JSON.stringify({
        type: "gameRequest",
        html: renderedGameRequest,
      })
    );
  }
};

app.route("/", usersRouter);
app.route("/", clickOnSignalGame);

app.use("/profile_pics/*", serveStatic({ root: "./" }));
app.use("/styles.css", serveStatic({ root: "./" }));
app.use(attachUser);

app.get("/", async (c) => {
  const rendered = await renderFile("views/index.html", {
    user: c.get("user"),
  });
  return c.html(rendered);
});

app.get("/mainPage", onlyForUsers, async (c) => {
  const user = c.get("user");
  const players = await getActiveFriends(user.id);
  const gameRequests = await getGameRequests(user.id);

  const rendered = await renderFile("views/mainPage.html", {
    players,
    gameRequests,
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
    const token = getCookie(c, "token");

    console.log(c.req.path);
    return {
      onOpen: async (event, ws) => {
        const user = await getUserByToken(token);

        connections.set(ws, user.id);
        console.log("open");
      },
      onClose: (event, ws) => {
        connections.delete(ws);
        console.log("closed");
      },
    };
  })
);
//TODO: add image/name/password change to profile page
//TODO: after page refresh, game request dissapear
