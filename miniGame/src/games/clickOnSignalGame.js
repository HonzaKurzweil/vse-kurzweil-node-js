import { Hono } from "hono";
import { connections } from "../app.js";
import { getActiveFriends } from "../users.js";

export const clickOnSignalGame = new Hono();

export const currentGames = new Set(GameInstancec);

class GameInstancec {
  constructor() {
    this.id = crypto.randomUUID();
    this.players = [];
    this.state = "waiting"; // waiting, ready, finished
    this.winner = null;
    this.clicked = false;
    this.startTime = null;
  }

  addPlayer(ws) {
    this.players.push(ws);
  }

  broadcast(msg) {
    for (const ws of this.players) {
      if (ws.readyState === 1) ws.send(JSON.stringify(msg));
    }
  }

  start() {
    this.broadcast({ type: "wait" });
    setTimeout(() => {
      if (this.state !== "waiting") return;
      this.state = "ready";
      this.clicked = false;
      this.broadcast({ type: "ready" });
    }, randomDelay());
  }
}

const createNewClickOnSignalGame = (playerId) => {
  const game = new GameInstancec();
  game.addPlayer(playerId);
  currentGames.add(game);
  return game;
};

clickOnSignalGame.get("/sendGameRequest/:receiverId", async (c) => {
  const id = Number(c.req.param("receiverId"));
  if (!id) {
    return c.text("invalid receiver id", 400);
  }

  const sender = c.get("user");
  if (!sender) {
    return c.text("unauthorized", 401);
  }

  const activeFriends = getActiveFriends(sender.id);

  const receiver = activeFriends.find((friend) => friend.id === id);
  if (!receiver) {
    return c.text("receiver not found", 404);
  }

  const game = createNewClickOnSignalGame(sender.id);

  connections.forEach((ws, userId) => {
    if (userId === receiver.id) {
      ws.send(
        JSON.stringify({
          type: "gameRequest",
          gameId: game.id,
        })
      );
    }
  });

  c.set("game", game.id);
  const rendered = await renderFile("views/clickOnSignalGame.html");
  return c.html(rendered, 401);
});

clickOnSignalGame.get("acceptGameRequest/:gameId", async (c) => {
  const gameId = c.req.param("gameId");
  if (!gameId) {
    return c.text("invalid game id", 400);
  }

  const game = currentGames.find((g) => g.id === gameId);
  if (!game) {
    return c.text("game not found", 404);
  }

  if (game.state !== "waiting") {
    return c.text("game already started or finished", 400);
  }

  if (game.players.length >= 2) {
    return c.text("game is full", 400);
  }
  c.set("game", gameId);
  game.addPlayer(c.get("user").id);

  connections.forEach((ws, userId) => {
    if (userId === player.id) {
      ws.send(
        JSON.stringify({
          type: "gameAccepted",
          gameId: gameId,
        })
      );
    }
  });

  const rendered = await renderFile("views/clickOnSignalGame.html");
  return c.html(rendered, 200);
});
