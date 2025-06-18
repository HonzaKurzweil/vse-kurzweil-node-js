import { Hono } from "hono";
import { connections, redirectToMainPage } from "../app.js";
import { getActiveFriends } from "../users.js";
import { renderFile } from "ejs";
import { findUserById } from "../db.js";

export const clickOnSignalGame = new Hono();

class GameInstance {
  constructor() {
    this.id = crypto.randomUUID();
    this.gameType = "clickOnSignal";
    this.players = [];
    this.state = "waiting"; // waiting, ready, finished
    this.winner = null;
    this.clicked = false;
    this.startTime = null;
  }

  addPlayer(playerId) {
    this.players.push(playerId);
  }

  removePlayer(playerId) {
    const idx = this.players.indexOf(playerId);
    if (idx !== -1) {
      this.players.splice(idx, 1);
    }
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

export const currentGames = new Set();

const gameRequests = [];

//TODO: do when request is declined or any user quits game
function removeGameRequest(player1, player2) {
  const idx = gameRequests.findIndex(
    (pair) => pair[0] === player1 && pair[1] === player2
  );
  if (idx !== -1) gameRequests.splice(idx, 1);
}

function addUniqueGameRequest(player1, player2) {
  const exists = gameRequests.some(
    (pair) => pair[0] === player1 && pair[1] === player2
  );
  if (!exists) {
    gameRequests.push([player1, player2]);
  }
}

const createNewClickOnSignalGame = (playerId) => {
  const game = new GameInstance();
  game.addPlayer(playerId);
  currentGames.add(game);
  return game;
};

// returns users that send a request
export const getGameRequests = async (receiverId) => {
  const relevantPairs = gameRequests.filter((pair) => pair[1] == receiverId);
  const users = await Promise.all(
    relevantPairs.map((pair) => findUserById(pair[0]))
  );
  return users.filter(Boolean);
};

clickOnSignalGame.post("/sendGameRequest", async (c) => {
  const id = (await c.req.formData()).get("receiverId");
  console.log("sendGameRequest called: ", id);
  if (!id) {
    console.log("Invalid receiver id");
    return c.text("invalid receiver id", 400);
  }

  const sender = c.get("user");
  if (!sender) {
    console.log("Unauthorized: no sender");
    return c.text("unauthorized", 401);
  }

  const activeFriends = await getActiveFriends(sender.id);
  console.log("Active friends for sender:", activeFriends);

  const receiver = activeFriends.find(
    (friend) => String(friend.id) === String(id)
  );
  if (!receiver) {
    console.log("Receiver not found among active friends");
    return c.text("receiver not found", 404);
  }

  const game = createNewClickOnSignalGame(sender.id);
  console.log("Created new game:", game);

  addUniqueGameRequest(sender.id, receiver.id);

  const requestSenders = await getGameRequests(receiver.id);

  const receivedGameRequests = await renderFile(
    "views/_receiveGameRequest.html",
    {
      gameRequests: requestSenders,
    }
  );
  let sent = false;
  connections.forEach((userId, ws) => {
    console.log("Checking connection for userId:", userId);
    if (String(userId) === String(receiver.id)) {
      console.log("Sending newGameRequest to receiver:", receiver.id);
      ws.send(
        JSON.stringify({
          type: "newGameRequest",
          html: receivedGameRequests,
        })
      );
      sent = true;
    }
  });
  if (!sent) {
    console.log("No WebSocket found for receiver:", receiver.id);
  }

  const players = await getAllPlayersInGame(game);

  const rendered = await renderFile("views/clickOnSignalGame.html", {
    players,
  });
  return c.html(rendered, 200);
});

clickOnSignalGame.post("/acceptGameRequest/:senderId", async (c) => {
  const sender = findUserById(c.req.param("senderId"));

  if (!sender) {
    return c.text("invalid game id", 400);
  }

  const game = await findGameBySenderId(sender.id);

  if (!game) {
    return c.text("game not found", 404);
  }

  if (game.state !== "waiting") {
    return c.text("game already started or finished", 400);
  }

  game.addPlayer(c.get("user").id);

  connections.forEach((ws, userId) => {
    if (userId === sender.id) {
      ws.send(
        JSON.stringify({
          type: "gameAccepted",
          gameId: gameId,
        })
      );
    }
  });

  const players = await getAllPlayersInGame(game);

  const rendered = await renderFile("views/clickOnSignalGame.html", {
    players,
  });
  return c.html(rendered, 200);
});

clickOnSignalGame.post("/declineGameRequest/:senderId", async (c) => {
  const sender = findUserById(c.req.param("senderId"));

  if (!sender) {
    return c.text("invalid game id", 400);
  }

  const game = await findGameBySenderId(sender.id);

  if (!game) {
    return c.text("game not found", 404);
  }

  if (game.state !== "waiting") {
    return c.text("game already started or finished", 400);
  }

  removeGameRequest(sender.id, c.get("user").id);

  game.state = "finished";

  connections.forEach((ws, userId) => {
    if (userId === sender.id) {
      ws.send(
        JSON.stringify({
          type: "gameDeclined",
          gameId: gameId,
        })
      );
    }
  });
  return c.text("game request declined", 200);
});

clickOnSignalGame.get("/exitGame", async (c) => {
  const game = findGameByParticipantId(c.get("user").id);
  exitGame(game, c.get("user").id);

  return await redirectToMainPage(c);
});

async function exitGame(game, exitingPlayerId) {
  game.removePlayer(exitingPlayerId);

  const players = await getAllPlayersInGame(game);

  const rendered = await renderFile("views/_activePlayers.html", {
    players,
  });

  for (const playerId of game.players) {
    if (playerId !== exitingPlayerId) {
      for (const [ws, userId] of connections.entries()) {
        if (userId === playerId) {
          ws.send(
            JSON.stringify({
              type: "gameParticipantsChange",
              html: rendered,
            })
          );
        }
      }
    }
  }
}

function findGameBySenderId(senderId) {
  console.log(currentGames);
  for (const game of currentGames) {
    if (game.players.length === 1 && game.players[0].id === senderId) {
      return game;
    }
  }
  return null;
}

function findGameByParticipantId(participantId) {
  for (const game of currentGames) {
    if (game.players.some((playerId) => playerId === participantId)) {
      return game;
    }
  }
  return null;
}

async function getAllPlayersInGame(game) {
  const users = await Promise.all(
    game.players.map((playerId) => findUserById(playerId))
  );
  return users.filter(Boolean);
}
