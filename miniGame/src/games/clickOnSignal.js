import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";

export const clickOnSignalRouter = new Hono();
const { upgradeWebSocket } = createNodeWebSocket({ app: clickOnSignalRouter });

// In-memory game sessions: { [gameId]: { players: [ws, ws], state, ... } }
const games = {};
let waitingPlayer = null;
let waitingPlayerName = null;

function randomDelay() {
  return 3000 + Math.floor(Math.random() * 4000); // 3-7 seconds
}

function broadcast(game, msg) {
  for (const ws of game.players) {
    if (ws.readyState === 1) ws.send(JSON.stringify(msg));
  }
}

function startGame(game) {
  game.state = "waiting";
  game.winner = null;
  broadcast(game, { type: "wait" });
  setTimeout(() => {
    if (game.state !== "waiting") return;
    game.state = "go";
    game.clicked = false;
    broadcast(game, { type: "go" });
  }, randomDelay());
}

clickOnSignalRouter.get(
  "/ws/click-on-signal",
  upgradeWebSocket((c) => {
    // You can get user info from cookies/session if needed
    const url = new URL(c.req.url);
    const username = url.searchParams.get("username") || "Player";
    return {
      onOpen: (event, ws) => {
        ws.username = username;
        if (waitingPlayer && waitingPlayer.readyState === 1) {
          // Start a new game
          const gameId = Math.random().toString(36).slice(2);
          const game = {
            id: gameId,
            players: [waitingPlayer, ws],
            state: "waiting",
            winner: null,
          };
          games[gameId] = game;
          ws.gameId = gameId;
          waitingPlayer.gameId = gameId;
          broadcast(game, { type: "wait" });
          setTimeout(() => startGame(game), 500); // Small delay before starting
          waitingPlayer = null;
          waitingPlayerName = null;
        } else {
          waitingPlayer = ws;
          waitingPlayerName = username;
          ws.send(
            JSON.stringify({ type: "wait", text: "Waiting for opponent..." })
          );
        }
      },
      onMessage: (event, ws) => {
        const msg = JSON.parse(event.data);
        const gameId = ws.gameId;
        const game = games[gameId];
        if (!game) return;
        if (msg.type === "click" && game.state === "go" && !game.clicked) {
          game.clicked = true;
          game.state = "finished";
          game.winner = ws;
          broadcast(game, {
            type: "result",
            text: `${ws.username || "A player"} won!`,
          });
        }
        if (msg.type === "playAgain") {
          startGame(game);
        }
        if (msg.type === "quit") {
          // Notify both and clean up
          broadcast(game, {
            type: "result",
            text: "Opponent quit. Game over.",
          });
          for (const p of game.players) {
            p.close();
          }
          delete games[gameId];
        }
      },
      onClose: (event, ws) => {
        const gameId = ws.gameId;
        if (gameId && games[gameId]) {
          broadcast(games[gameId], {
            type: "result",
            text: "Opponent disconnected.",
          });
          for (const p of games[gameId].players) {
            if (p !== ws) p.close();
          }
          delete games[gameId];
        }
        if (waitingPlayer === ws) {
          waitingPlayer = null;
          waitingPlayerName = null;
        }
      },
    };
  })
);
