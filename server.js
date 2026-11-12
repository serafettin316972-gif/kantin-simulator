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

// ============== GAME DATA ==============
const INGREDIENTS = {
  un:        { name: "Un", price: 8, emoji: "🌾" },
  peynir:    { name: "Peynir", price: 15, emoji: "🧀" },
  sucuk:     { name: "Sucuk", price: 22, emoji: "🌭" },
  yumurta:   { name: "Yumurta", price: 6, emoji: "🥚" },
  cay:       { name: "Çay", price: 5, emoji: "🍵" },
  su:        { name: "Su", price: 3, emoji: "💧" },
  seker:     { name: "Şeker", price: 4, emoji: "🍬" },
  domates:   { name: "Domates", price: 7, emoji: "🍅" },
  salatalik: { name: "Salatalık", price: 6, emoji: "🥒" },
  yogurt:    { name: "Yoğurt", price: 10, emoji: "🥛" },
  et:        { name: "Kıyma", price: 28, emoji: "🥩" },
  patates:   { name: "Patates", price: 9, emoji: "🥔" }
};

const RECIPES = {
  tost: {
    name: "Tost",
    emoji: "🥪",
    ingredients: { un: 1, peynir: 1, sucuk: 1 },
    sellPrice: 35,
    prepTime: 3,
    category: "ana"
  },
  simit: {
    name: "Simit",
    emoji: "🥯",
    ingredients: { un: 2 },
    sellPrice: 12,
    prepTime: 2,
    category: "ana"
  },
  cay: {
    name: "Çay",
    emoji: "☕",
    ingredients: { cay: 1, seker: 1 },
    sellPrice: 8,
    prepTime: 1,
    category: "icecek"
  },
  ayran: {
    name: "Ayran",
    emoji: "🥛",
    ingredients: { yogurt: 1, su: 1 },
    sellPrice: 10,
    prepTime: 1,
    category: "icecek"
  },
  pogaca: {
    name: "Poğaça",
    emoji: "🥐",
    ingredients: { un: 1, peynir: 1 },
    sellPrice: 15,
    prepTime: 2,
    category: "ana"
  },
  menemen: {
    name: "Menemen",
    emoji: "🍳",
    ingredients: { yumurta: 2, domates: 1 },
    sellPrice: 28,
    prepTime: 4,
    category: "ana"
  },
  kofte: {
    name: "Köfte Ekmek",
    emoji: "🥙",
    ingredients: { et: 1, un: 1, domates: 1 },
    sellPrice: 45,
    prepTime: 5,
    category: "ana"
  },
  patatesKizartma: {
    name: "Patates Kızartma",
    emoji: "🍟",
    ingredients: { patates: 2 },
    sellPrice: 18,
    prepTime: 3,
    category: "yan"
  }
};

const UPGRADES = {
  hizliFirin: {
    name: "Hızlı Fırın",
    desc: "Hazırlama süresi %30 azalır",
    price: 150,
    maxLevel: 3,
    effect: "prepSpeed"
  },
  genisTezgah: {
    name: "Geniş Tezgah",
    desc: "Aynı anda daha fazla ürün hazırlanabilir",
    price: 200,
    maxLevel: 2,
    effect: "prepSlots"
  },
  reklam: {
    name: "Reklam Panosu",
    desc: "Daha fazla müşteri gelir",
    price: 120,
    maxLevel: 3,
    effect: "customerRate"
  },
  rahatMasalar: {
    name: "Rahat Masalar",
    desc: "Müşteri sabrı artar",
    price: 100,
    maxLevel: 2,
    effect: "patience"
  },
  kaliteliMalzeme: {
    name: "Kaliteli Malzeme",
    desc: "Satış fiyatı %15 artar",
    price: 180,
    maxLevel: 2,
    effect: "sellBonus"
  }
};

const CUSTOMER_NAMES = [
  "Ahmet", "Ayşe", "Mehmet", "Zeynep", "Can", "Elif", "Burak", "Selin",
  "Emre", "Deniz", "Ceren", "Kaan", "İrem", "Yusuf", "Sude", "Ege"
];

// ============== ROOMS ==============
const rooms = new Map();

function generateRoomCode() {
  let code;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms.has(code));
  return code;
}

function createInitialState() {
  return {
    money: 250,
    reputation: 50,
    day: 1,
    time: 8, // 8:00 start
    timeSpeed: 1, // minutes per tick
    inventory: {
      un: 5, peynir: 3, sucuk: 2, yumurta: 4, cay: 8,
      su: 10, seker: 6, domates: 3, salatalik: 2, yogurt: 3, et: 1, patates: 4
    },
    readyFood: {}, // { tost: 2, cay: 5 ... }
    customers: [],
    upgrades: {
      hizliFirin: 0,
      genisTezgah: 0,
      reklam: 0,
      rahatMasalar: 0,
      kaliteliMalzeme: 0
    },
    prepQueue: [], // { id, recipeId, progress, total, playerId }
    maxPrepSlots: 2,
    stats: {
      totalSold: 0,
      totalEarned: 0,
      customersServed: 0,
      angryCustomers: 0
    },
    status: "lobby", // lobby | playing | ended
    log: []
  };
}

function getPrepSpeedMultiplier(upgrades) {
  return 1 + (upgrades.hizliFirin * 0.30);
}

function getSellBonus(upgrades) {
  return 1 + (upgrades.kaliteliMalzeme * 0.15);
}

function getCustomerSpawnChance(upgrades, time) {
  let base = 0.25;
  // Teneffüs ve öğle daha yoğun
  if (time >= 10 && time < 11) base = 0.55; // teneffüs
  if (time >= 12 && time < 13.5) base = 0.70; // öğle
  if (time >= 14.5 && time < 15.5) base = 0.45;
  base += upgrades.reklam * 0.12;
  return Math.min(base, 0.85);
}

function getPatienceBonus(upgrades) {
  return upgrades.rahatMasalar * 8;
}

function createCustomer(upgrades) {
  const possibleOrders = Object.keys(RECIPES);
  const orderCount = Math.random() < 0.6 ? 1 : 2;
  const orders = [];
  for (let i = 0; i < orderCount; i++) {
    orders.push(possibleOrders[Math.floor(Math.random() * possibleOrders.length)]);
  }
  const basePatience = 25 + Math.floor(Math.random() * 15) + getPatienceBonus(upgrades);
  return {
    id: uuidv4().slice(0, 8),
    name: CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)],
    orders,
    patience: basePatience,
    maxPatience: basePatience,
    status: "waiting", // waiting | served | left
    joinedAt: Date.now()
  };
}

// ============== SOCKET ==============
io.on("connection", (socket) => {
  console.log("Bağlandı:", socket.id);

  socket.on("createRoom", ({ playerName }) => {
    const code = generateRoomCode();
    const room = {
      code,
      hostId: socket.id,
      players: {
        [socket.id]: {
          id: socket.id,
          name: playerName || "Oyuncu",
          score: 0,
          actions: 0
        }
      },
      state: createInitialState(),
      tickInterval: null
    };
    rooms.set(code, room);
    socket.join(code);
    socket.roomCode = code;
    socket.playerName = playerName;

    socket.emit("roomCreated", { code, players: Object.values(room.players) });
    console.log(`Oda oluştu: ${code}`);
  });

  socket.on("joinRoom", ({ code, playerName }) => {
    const room = rooms.get(code);
    if (!room) {
      socket.emit("error", { message: "Oda bulunamadı!" });
      return;
    }
    if (Object.keys(room.players).length >= 4) {
      socket.emit("error", { message: "Oda dolu! (Max 4 kişi)" });
      return;
    }
    if (room.state.status !== "lobby") {
      socket.emit("error", { message: "Oyun zaten başlamış!" });
      return;
    }

    room.players[socket.id] = {
      id: socket.id,
      name: playerName || "Oyuncu",
      score: 0,
      actions: 0
    };
    socket.join(code);
    socket.roomCode = code;
    socket.playerName = playerName;

    io.to(code).emit("playerJoined", {
      players: Object.values(room.players),
      newPlayer: playerName
    });
    socket.emit("joinedRoom", { code, players: Object.values(room.players), isHost: false });
  });

  socket.on("startGame", () => {
    const code = socket.roomCode;
    const room = rooms.get(code);
    if (!room || room.hostId !== socket.id) return;
    if (Object.keys(room.players).length < 1) return;

    room.state.status = "playing";
    room.state.log.push({ t: Date.now(), msg: "Kantinin kapıları açıldı! 🎉" });

    // Start game tick
    room.tickInterval = setInterval(() => gameTick(code), 1500);

    io.to(code).emit("gameStarted", { state: room.state, players: Object.values(room.players) });
  });

  socket.on("buyIngredient", ({ ingredientId, amount }) => {
    const code = socket.roomCode;
    const room = rooms.get(code);
    if (!room || room.state.status !== "playing") return;

    const ing = INGREDIENTS[ingredientId];
    if (!ing) return;
    amount = Math.max(1, Math.min(20, amount || 1));
    const cost = ing.price * amount;

    if (room.state.money < cost) {
      socket.emit("error", { message: "Yeterli paranız yok!" });
      return;
    }

    room.state.money -= cost;
    room.state.inventory[ingredientId] = (room.state.inventory[ingredientId] || 0) + amount;
    room.players[socket.id].actions++;
    room.players[socket.id].score += 1;

    room.state.log.unshift({ t: Date.now(), msg: `${room.players[socket.id].name} ${amount}x ${ing.name} aldı` });
    if (room.state.log.length > 30) room.state.log.pop();

    broadcastState(code);
  });

  socket.on("prepareFood", ({ recipeId }) => {
    const code = socket.roomCode;
    const room = rooms.get(code);
    if (!room || room.state.status !== "playing") return;

    const recipe = RECIPES[recipeId];
    if (!recipe) return;

    // Check slots
    const activePreps = room.state.prepQueue.filter(p => p.progress < p.total).length;
    const maxSlots = 2 + room.state.upgrades.genisTezgah;
    if (activePreps >= maxSlots) {
      socket.emit("error", { message: "Tezgah dolu! Upgrade alın veya bekleyin." });
      return;
    }

    // Check ingredients
    for (const [ing, qty] of Object.entries(recipe.ingredients)) {
      if ((room.state.inventory[ing] || 0) < qty) {
        socket.emit("error", { message: `Yetersiz malzeme: ${INGREDIENTS[ing]?.name || ing}` });
        return;
      }
    }

    // Deduct
    for (const [ing, qty] of Object.entries(recipe.ingredients)) {
      room.state.inventory[ing] -= qty;
    }

    const speedMult = getPrepSpeedMultiplier(room.state.upgrades);
    const totalTicks = Math.max(1, Math.ceil(recipe.prepTime / speedMult));

    room.state.prepQueue.push({
      id: uuidv4().slice(0, 8),
      recipeId,
      progress: 0,
      total: totalTicks,
      playerId: socket.id,
      playerName: room.players[socket.id].name
    });

    room.players[socket.id].actions++;
    room.state.log.unshift({ t: Date.now(), msg: `${room.players[socket.id].name} ${recipe.name} hazırlıyor...` });
    if (room.state.log.length > 30) room.state.log.pop();

    broadcastState(code);
  });

  socket.on("serveCustomer", ({ customerId, foodId }) => {
    const code = socket.roomCode;
    const room = rooms.get(code);
    if (!room || room.state.status !== "playing") return;

    const customer = room.state.customers.find(c => c.id === customerId && c.status === "waiting");
    if (!customer) return;

    if (!customer.orders.includes(foodId)) {
      socket.emit("error", { message: "Bu müşteri bunu istemiyor!" });
      return;
    }

    if ((room.state.readyFood[foodId] || 0) < 1) {
      socket.emit("error", { message: "Bu üründen hazır yok!" });
      return;
    }

    // Serve
    room.state.readyFood[foodId]--;
    customer.orders = customer.orders.filter(o => o !== foodId);

    const recipe = RECIPES[foodId];
    const bonus = getSellBonus(room.state.upgrades);
    const earned = Math.round(recipe.sellPrice * bonus);

    room.state.money += earned;
    room.state.stats.totalEarned += earned;
    room.state.stats.totalSold++;
    room.state.stats.customersServed++;
    room.players[socket.id].score += earned;
    room.players[socket.id].actions++;

    // Reputation small boost
    room.state.reputation = Math.min(100, room.state.reputation + 1);

    if (customer.orders.length === 0) {
      customer.status = "served";
      // Remove after short delay handled in tick
    }

    room.state.log.unshift({ t: Date.now(), msg: `${room.players[socket.id].name} ${customer.name}'e ${recipe.name} servis etti (+${earned}₺)` });
    if (room.state.log.length > 30) room.state.log.pop();

    broadcastState(code);
  });

  socket.on("buyUpgrade", ({ upgradeId }) => {
    const code = socket.roomCode;
    const room = rooms.get(code);
    if (!room || room.state.status !== "playing") return;

    const up = UPGRADES[upgradeId];
    if (!up) return;

    const currentLevel = room.state.upgrades[upgradeId] || 0;
    if (currentLevel >= up.maxLevel) {
      socket.emit("error", { message: "Maksimum seviyeye ulaşıldı!" });
      return;
    }

    const cost = up.price * (currentLevel + 1);
    if (room.state.money < cost) {
      socket.emit("error", { message: "Yeterli paranız yok!" });
      return;
    }

    room.state.money -= cost;
    room.state.upgrades[upgradeId] = currentLevel + 1;
    room.players[socket.id].score += 10;
    room.players[socket.id].actions++;

    room.state.log.unshift({ t: Date.now(), msg: `${room.players[socket.id].name} ${up.name} satın aldı! (Sv.${currentLevel + 1})` });
    if (room.state.log.length > 30) room.state.log.pop();

    broadcastState(code);
  });

  socket.on("disconnect", () => {
    const code = socket.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    delete room.players[socket.id];
    io.to(code).emit("playerLeft", {
      players: Object.values(room.players),
      leftName: socket.playerName
    });

    if (Object.keys(room.players).length === 0) {
      if (room.tickInterval) clearInterval(room.tickInterval);
      rooms.delete(code);
      console.log(`Oda silindi: ${code}`);
    } else if (room.hostId === socket.id) {
      // Transfer host
      room.hostId = Object.keys(room.players)[0];
      io.to(code).emit("hostChanged", { newHostId: room.hostId });
    }
  });
});

function broadcastState(code) {
  const room = rooms.get(code);
  if (!room) return;
  io.to(code).emit("stateUpdate", {
    state: room.state,
    players: Object.values(room.players)
  });
}

function gameTick(code) {
  const room = rooms.get(code);
  if (!room || room.state.status !== "playing") return;

  const state = room.state;

  // Advance time
  state.time += 0.25; // 15 real seconds ≈ 15 game minutes? Adjust feel
  if (state.time >= 17) {
    // End of day
    state.day++;
    state.time = 8;
    state.log.unshift({ t: Date.now(), msg: `🌅 Gün ${state.day} başladı!` });
    if (state.log.length > 30) state.log.pop();

    // Small daily bonus / cleanup
    if (state.day > 7) {
      // End game after 7 days
      state.status = "ended";
      clearInterval(room.tickInterval);
      io.to(code).emit("gameEnded", {
        state,
        players: Object.values(room.players)
      });
      return;
    }
  }

  // Progress prep queue
  state.prepQueue.forEach(p => {
    if (p.progress < p.total) {
      p.progress++;
      if (p.progress >= p.total) {
        state.readyFood[p.recipeId] = (state.readyFood[p.recipeId] || 0) + 1;
        state.log.unshift({ t: Date.now(), msg: `✅ ${RECIPES[p.recipeId].name} hazır! (${p.playerName})` });
        if (state.log.length > 30) state.log.pop();
      }
    }
  });
  // Clean finished
  state.prepQueue = state.prepQueue.filter(p => p.progress < p.total);

  // Spawn customers
  const spawnChance = getCustomerSpawnChance(state.upgrades, state.time);
  if (Math.random() < spawnChance && state.customers.filter(c => c.status === "waiting").length < 8) {
    const cust = createCustomer(state.upgrades);
    state.customers.push(cust);
  }

  // Decrease patience & remove
  state.customers.forEach(c => {
    if (c.status === "waiting") {
      c.patience -= 1;
      if (c.patience <= 0) {
        c.status = "left";
        state.reputation = Math.max(0, state.reputation - 4);
        state.stats.angryCustomers++;
        state.log.unshift({ t: Date.now(), msg: `😤 ${c.name} kızgın ayrıldı!` });
        if (state.log.length > 30) state.log.pop();
      }
    }
  });

  // Remove served / left after a bit
  state.customers = state.customers.filter(c => {
    if (c.status === "served" || c.status === "left") {
      // keep briefly then remove (simplified: remove immediately for clean UI)
      return false;
    }
    return true;
  });

  // Reputation passive
  if (state.reputation > 70 && Math.random() < 0.1) {
    // small money tip chance
  }

  broadcastState(code);
}

server.listen(PORT, () => {
  console.log(`Kantin Simulator çalışıyor: http://localhost:${PORT}`);
});
