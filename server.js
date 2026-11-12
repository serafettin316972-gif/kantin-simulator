const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const rooms = new Map();

function generateRoomCode() {
  let code;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms.has(code));
  return code;
}

function createPlayer(id, name) {
  // Spawn positions for up to 4 players
  const spawns = [
    { x: 0, y: 1.6, z: 5 },
    { x: 2, y: 1.6, z: 5 },
    { x: -2, y: 1.6, z: 5 },
    { x: 0, y: 1.6, z: 7 }
  ];
  const idx = Object.keys(rooms).length % 4; // rough
  return {
    id,
    name: name || "Oyuncu",
    x: 0,
    y: 1.6,
    z: 6,
    rotY: 0,
    color: ["#38bdf8", "#4ade80", "#f472b6", "#fbbf24"][Math.floor(Math.random() * 4)],
    score: 0
  };
}

io.on("connection", (socket) => {
  console.log("Bağlandı:", socket.id);

  socket.on("createRoom", ({ playerName }) => {
    const code = generateRoomCode();
    const player = createPlayer(socket.id, playerName);
    const room = {
      code,
      hostId: socket.id,
      players: { [socket.id]: player },
      status: "lobby"
    };
    rooms.set(code, room);
    socket.join(code);
    socket.roomCode = code;
    socket.playerName = playerName;

    socket.emit("roomCreated", {
      code,
      players: Object.values(room.players),
      myId: socket.id
    });
  });

  socket.on("joinRoom", ({ code, playerName }) => {
    const room = rooms.get(code);
    if (!room) {
      socket.emit("error", { message: "Oda bulunamadı!" });
      return;
    }
    if (Object.keys(room.players).length >= 4) {
      socket.emit("error", { message: "Oda dolu! (Max 4)" });
      return;
    }
    if (room.status !== "lobby") {
      socket.emit("error", { message: "Oyun başlamış!" });
      return;
    }

    const player = createPlayer(socket.id, playerName);
    // Offset spawn a bit
    const count = Object.keys(room.players).length;
    player.x = (count - 1.5) * 1.5;
    player.z = 6;

    room.players[socket.id] = player;
    socket.join(code);
    socket.roomCode = code;
    socket.playerName = playerName;

    io.to(code).emit("playerJoined", {
      players: Object.values(room.players),
      newPlayer: player
    });
    socket.emit("joinedRoom", {
      code,
      players: Object.values(room.players),
      myId: socket.id,
      isHost: false
    });
  });

  socket.on("startGame", () => {
    const code = socket.roomCode;
    const room = rooms.get(code);
    if (!room || room.hostId !== socket.id) return;

    room.status = "playing";
    io.to(code).emit("gameStarted", {
      players: Object.values(room.players)
    });
  });

  // Player movement update
  socket.on("move", (data) => {
    const code = socket.roomCode;
    const room = rooms.get(code);
    if (!room || !room.players[socket.id]) return;

    const p = room.players[socket.id];
    p.x = data.x;
    p.y = data.y;
    p.z = data.z;
    p.rotY = data.rotY;

    // Broadcast to others only
    socket.to(code).emit("playerMoved", {
      id: socket.id,
      x: p.x,
      y: p.y,
      z: p.z,
      rotY: p.rotY
    });
  });

  socket.on("interact", (data) => {
    const code = socket.roomCode;
    const room = rooms.get(code);
    if (!room) return;

    // Simple score for interacting
    if (room.players[socket.id]) {
      room.players[socket.id].score += 5;
    }

    io.to(code).emit("interaction", {
      playerId: socket.id,
      playerName: room.players[socket.id]?.name,
      type: data.type,
      message: data.message
    });
  });

  socket.on("disconnect", () => {
    const code = socket.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    delete room.players[socket.id];
    io.to(code).emit("playerLeft", {
      id: socket.id,
      players: Object.values(room.players)
    });

    if (Object.keys(room.players).length === 0) {
      rooms.delete(code);
    } else if (room.hostId === socket.id) {
      room.hostId = Object.keys(room.players)[0];
    }
  });
});

server.listen(PORT, () => {
  console.log(`Kantin 3D çalışıyor: http://localhost:${PORT}`);
});
