const socket = io();

// ============ STATE ============
let currentRoom = null;
let isHost = false;
let gameState = null;
let players = [];
let myId = null;

// Data mirrors (from server conceptually)
const INGREDIENTS = {
  un: { name: "Un", price: 8, emoji: "🌾" },
  peynir: { name: "Peynir", price: 15, emoji: "🧀" },
  sucuk: { name: "Sucuk", price: 22, emoji: "🌭" },
  yumurta: { name: "Yumurta", price: 6, emoji: "🥚" },
  cay: { name: "Çay", price: 5, emoji: "🍵" },
  su: { name: "Su", price: 3, emoji: "💧" },
  seker: { name: "Şeker", price: 4, emoji: "🍬" },
  domates: { name: "Domates", price: 7, emoji: "🍅" },
  salatalik: { name: "Salatalık", price: 6, emoji: "🥒" },
  yogurt: { name: "Yoğurt", price: 10, emoji: "🥛" },
  et: { name: "Kıyma", price: 28, emoji: "🥩" },
  patates: { name: "Patates", price: 9, emoji: "🥔" }
};

const RECIPES = {
  tost: { name: "Tost", emoji: "🥪", ingredients: { un: 1, peynir: 1, sucuk: 1 }, sellPrice: 35 },
  simit: { name: "Simit", emoji: "🥯", ingredients: { un: 2 }, sellPrice: 12 },
  cay: { name: "Çay", emoji: "☕", ingredients: { cay: 1, seker: 1 }, sellPrice: 8 },
  ayran: { name: "Ayran", emoji: "🥛", ingredients: { yogurt: 1, su: 1 }, sellPrice: 10 },
  pogaca: { name: "Poğaça", emoji: "🥐", ingredients: { un: 1, peynir: 1 }, sellPrice: 15 },
  menemen: { name: "Menemen", emoji: "🍳", ingredients: { yumurta: 2, domates: 1 }, sellPrice: 28 },
  kofte: { name: "Köfte Ekmek", emoji: "🥙", ingredients: { et: 1, un: 1, domates: 1 }, sellPrice: 45 },
  patatesKizartma: { name: "Patates Kızartma", emoji: "🍟", ingredients: { patates: 2 }, sellPrice: 18 }
};

const UPGRADES = {
  hizliFirin: { name: "Hızlı Fırın", desc: "Hazırlama süresi %30 azalır", price: 150, maxLevel: 3 },
  genisTezgah: { name: "Geniş Tezgah", desc: "Daha fazla ürün aynı anda", price: 200, maxLevel: 2 },
  reklam: { name: "Reklam Panosu", desc: "Daha fazla müşteri gelir", price: 120, maxLevel: 3 },
  rahatMasalar: { name: "Rahat Masalar", desc: "Müşteri sabrı artar", price: 100, maxLevel: 2 },
  kaliteliMalzeme: { name: "Kaliteli Malzeme", desc: "Satış fiyatı %15 artar", price: 180, maxLevel: 2 }
};

// ============ DOM ============
const $ = (sel) => document.querySelector(sel);
const lobby = $("#lobby");
const game = $("#game");
const endScreen = $("#endScreen");
const playerNameInput = $("#playerName");
const roomCodeInput = $("#roomCode");
const btnCreate = $("#btnCreate");
const btnJoin = $("#btnJoin");
const btnStart = $("#btnStart");
const lobbyError = $("#lobbyError");
const lobbyPlayers = $("#lobbyPlayers");
const playerList = $("#playerList");
const displayCode = $("#displayCode");
const playerCount = $("#playerCount");
const toastEl = $("#toast");

// ============ HELPERS ============
function showToast(msg, duration = 2500) {
  toastEl.textContent = msg;
  toastEl.classList.remove("hidden");
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => toastEl.classList.add("hidden"), duration);
}

function showError(msg) {
  lobbyError.textContent = msg;
  lobbyError.classList.remove("hidden");
  setTimeout(() => lobbyError.classList.add("hidden"), 3500);
}

function formatTime(t) {
  const h = Math.floor(t);
  const m = Math.floor((t % 1) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function canMake(recipeId, inventory) {
  const recipe = RECIPES[recipeId];
  if (!recipe) return false;
  for (const [ing, qty] of Object.entries(recipe.ingredients)) {
    if ((inventory[ing] || 0) < qty) return false;
  }
  return true;
}

// ============ RENDER ============
function renderLobbyPlayers(list) {
  playerList.innerHTML = "";
  list.forEach(p => {
    const li = document.createElement("li");
    li.textContent = p.name + (p.id === myId ? " (Sen)" : "");
    playerList.appendChild(li);
  });
  playerCount.textContent = list.length;
  if (isHost && list.length >= 1) {
    btnStart.classList.remove("hidden");
  } else {
    btnStart.classList.add("hidden");
  }
}

function renderInventory(inv) {
  const el = $("#inventoryList");
  el.innerHTML = "";
  for (const [id, data] of Object.entries(INGREDIENTS)) {
    const qty = inv[id] || 0;
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="item-info">
        <span class="item-emoji">${data.emoji}</span>
        <span>${data.name}</span>
      </div>
      <span class="item-qty">${qty}</span>
    `;
    el.appendChild(card);
  }
}

function renderShop() {
  const el = $("#shopList");
  el.innerHTML = "";
  for (const [id, data] of Object.entries(INGREDIENTS)) {
    const card = document.createElement("div");
    card.className = "shop-card";
    card.innerHTML = `
      <div class="shop-info">
        <span class="item-emoji">${data.emoji}</span>
        <span>${data.name} <small style="color:var(--text-muted)">${data.price}₺</small></span>
      </div>
      <button data-buy="${id}">+1</button>
    `;
    card.querySelector("button").onclick = () => {
      socket.emit("buyIngredient", { ingredientId: id, amount: 1 });
    };
    el.appendChild(card);
  }
}

function renderRecipes(state) {
  const el = $("#recipeList");
  el.innerHTML = "";
  for (const [id, data] of Object.entries(RECIPES)) {
    const can = canMake(id, state.inventory);
    const card = document.createElement("div");
    card.className = "recipe-card";
    const ings = Object.entries(data.ingredients)
      .map(([k, v]) => `${INGREDIENTS[k]?.emoji || ""}${v}`)
      .join(" ");
    card.innerHTML = `
      <div class="recipe-info">
        <span class="recipe-emoji">${data.emoji}</span>
        <div>
          <div>${data.name}</div>
          <small style="color:var(--text-muted);font-size:0.75rem">${ings} → ${data.sellPrice}₺</small>
        </div>
      </div>
      <button data-prep="${id}" ${can ? "" : "disabled"}>Hazırla</button>
    `;
    card.querySelector("button").onclick = () => {
      socket.emit("prepareFood", { recipeId: id });
    };
    el.appendChild(card);
  }
}

function renderUpgrades(state) {
  const el = $("#upgradeList");
  el.innerHTML = "";
  for (const [id, data] of Object.entries(UPGRADES)) {
    const level = state.upgrades[id] || 0;
    const cost = data.price * (level + 1);
    const maxed = level >= data.maxLevel;
    const card = document.createElement("div");
    card.className = "upgrade-card";
    card.innerHTML = `
      <div class="upgrade-header">
        <span>${data.name}</span>
        <span class="upgrade-level">Sv.${level}/${data.maxLevel}</span>
      </div>
      <div class="upgrade-desc">${data.desc}</div>
      <button data-up="${id}" ${maxed || state.money < cost ? "disabled" : ""}>
        ${maxed ? "MAX" : cost + "₺"}
      </button>
    `;
    if (!maxed) {
      card.querySelector("button").onclick = () => {
        socket.emit("buyUpgrade", { upgradeId: id });
      };
    }
    el.appendChild(card);
  }
}

function renderPrepAndReady(state) {
  const slots = $("#prepSlots");
  slots.innerHTML = "";
  state.prepQueue.forEach(p => {
    const recipe = RECIPES[p.recipeId];
    const pct = Math.min(100, (p.progress / p.total) * 100);
    const div = document.createElement("div");
    div.className = "prep-item";
    div.innerHTML = `
      ${recipe?.emoji || "?"} ${recipe?.name || p.recipeId}
      <div class="prep-bar"><div class="prep-bar-fill" style="width:${pct}%"></div></div>
    `;
    slots.appendChild(div);
  });

  const ready = $("#readyFoods");
  ready.innerHTML = "";
  for (const [id, qty] of Object.entries(state.readyFood || {})) {
    if (qty < 1) continue;
    const recipe = RECIPES[id];
    const div = document.createElement("div");
    div.className = "ready-item";
    div.innerHTML = `${recipe?.emoji || "?"} ${recipe?.name || id} ×${qty}`;
    ready.appendChild(div);
  }
}

function renderCustomers(state) {
  const el = $("#customerList");
  el.innerHTML = "";
  const waiting = (state.customers || []).filter(c => c.status === "waiting");
  if (waiting.length === 0) {
    el.innerHTML = `<div style="color:var(--text-muted);font-size:0.9rem;padding:12px">Şu an müşteri yok...</div>`;
    return;
  }
  waiting.forEach(c => {
    const pct = Math.max(0, (c.patience / c.maxPatience) * 100);
    let barClass = "";
    if (pct < 30) barClass = "low";
    else if (pct < 60) barClass = "medium";

    const card = document.createElement("div");
    card.className = "customer-card" + (pct < 30 ? " low-patience" : "");
    card.innerHTML = `
      <div class="customer-name">
        <span>${c.name}</span>
        <span style="font-size:0.8rem;color:var(--text-muted)">${Math.ceil(c.patience)}s</span>
      </div>
      <div class="patience-bar">
        <div class="patience-fill ${barClass}" style="width:${pct}%"></div>
      </div>
      <div class="customer-orders"></div>
    `;
    const ordersDiv = card.querySelector(".customer-orders");
    c.orders.forEach(oid => {
      const recipe = RECIPES[oid];
      const hasReady = (state.readyFood[oid] || 0) > 0;
      const btn = document.createElement("button");
      btn.className = "order-btn";
      btn.textContent = `${recipe?.emoji || "?"} ${recipe?.name || oid}`;
      btn.disabled = !hasReady;
      btn.onclick = () => {
        socket.emit("serveCustomer", { customerId: c.id, foodId: oid });
      };
      ordersDiv.appendChild(btn);
    });
    el.appendChild(card);
  });
}

function renderLog(log) {
  const el = $("#activityLog");
  el.innerHTML = "";
  (log || []).slice(0, 12).forEach(entry => {
    const li = document.createElement("li");
    li.textContent = entry.msg;
    el.appendChild(li);
  });
}

function renderPlayersMini(list) {
  const el = $("#playersMini");
  el.innerHTML = "";
  list.forEach(p => {
    const chip = document.createElement("div");
    chip.className = "player-chip";
    chip.textContent = p.name + (p.score ? ` (${p.score})` : "");
    el.appendChild(chip);
  });
}

function renderFullState(state, playerList) {
  gameState = state;
  players = playerList || players;

  $("#money").textContent = Math.floor(state.money);
  $("#reputation").textContent = Math.floor(state.reputation);
  $("#dayLabel").textContent = `Gün ${state.day}`;
  $("#timeLabel").textContent = formatTime(state.time);

  renderInventory(state.inventory);
  renderRecipes(state);
  renderUpgrades(state);
  renderPrepAndReady(state);
  renderCustomers(state);
  renderLog(state.log);
  renderPlayersMini(players);
}

// ============ SOCKET EVENTS ============
socket.on("connect", () => {
  myId = socket.id;
});

socket.on("roomCreated", ({ code, players: plist }) => {
  currentRoom = code;
  isHost = true;
  players = plist;
  displayCode.textContent = code;
  lobbyPlayers.classList.remove("hidden");
  renderLobbyPlayers(plist);
  showToast(`Oda oluşturuldu: ${code}`);
});

socket.on("joinedRoom", ({ code, players: plist, isHost: host }) => {
  currentRoom = code;
  isHost = host;
  players = plist;
  displayCode.textContent = code;
  lobbyPlayers.classList.remove("hidden");
  renderLobbyPlayers(plist);
  showToast(`Odaya katıldın: ${code}`);
});

socket.on("playerJoined", ({ players: plist, newPlayer }) => {
  players = plist;
  renderLobbyPlayers(plist);
  showToast(`${newPlayer} katıldı`);
});

socket.on("playerLeft", ({ players: plist, leftName }) => {
  players = plist;
  renderLobbyPlayers(plist);
  if (game.classList.contains("active")) {
    renderPlayersMini(plist);
  }
  showToast(`${leftName || "Bir oyuncu"} ayrıldı`);
});

socket.on("hostChanged", () => {
  // simple: if we are now first, become host (server already set)
});

socket.on("gameStarted", ({ state, players: plist }) => {
  lobby.classList.remove("active");
  game.classList.add("active");
  endScreen.classList.remove("active");
  players = plist;
  renderShop(); // static
  renderFullState(state, plist);
  showToast("Kantinin kapıları açıldı! 🎉");
});

socket.on("stateUpdate", ({ state, players: plist }) => {
  renderFullState(state, plist);
});

socket.on("gameEnded", ({ state, players: plist }) => {
  game.classList.remove("active");
  endScreen.classList.add("active");

  const stats = state.stats || {};
  $("#finalStats").innerHTML = `
    <div><strong>Toplam Kazanç:</strong> ${stats.totalEarned || 0}₺</div>
    <div><strong>Satılan Ürün:</strong> ${stats.totalSold || 0}</div>
    <div><strong>Mutlu Müşteri:</strong> ${stats.customersServed || 0}</div>
    <div><strong>Kızgın Müşteri:</strong> ${stats.angryCustomers || 0}</div>
    <div><strong>Son Para:</strong> ${Math.floor(state.money)}₺</div>
    <div><strong>İtibar:</strong> ${Math.floor(state.reputation)}</div>
  `;

  const sorted = [...plist].sort((a, b) => (b.score || 0) - (a.score || 0));
  $("#finalRanking").innerHTML = "<strong>Sıralama</strong>" + sorted.map((p, i) =>
    `<div><span>${i + 1}. ${p.name}</span><span>${p.score || 0} puan</span></div>`
  ).join("");
});

socket.on("error", ({ message }) => {
  showToast(message);
  if (!game.classList.contains("active")) {
    showError(message);
  }
});

// ============ UI EVENTS ============
btnCreate.onclick = () => {
  const name = playerNameInput.value.trim() || "Oyuncu";
  if (name.length < 2) {
    showError("En az 2 karakterlik isim gir");
    return;
  }
  socket.emit("createRoom", { playerName: name });
};

btnJoin.onclick = () => {
  const name = playerNameInput.value.trim() || "Oyuncu";
  const code = roomCodeInput.value.trim();
  if (name.length < 2) {
    showError("En az 2 karakterlik isim gir");
    return;
  }
  if (!code || code.length !== 4) {
    showError("4 haneli oda kodu gir");
    return;
  }
  socket.emit("joinRoom", { code, playerName: name });
};

btnStart.onclick = () => {
  socket.emit("startGame");
};

$("#btnReplay").onclick = () => {
  location.reload();
};

// Enter key support
playerNameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnCreate.click();
});
roomCodeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnJoin.click();
});
