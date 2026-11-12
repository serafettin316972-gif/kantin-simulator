const socket = io();

// ============ DOM ============
const lobby = document.getElementById("lobby");
const hud = document.getElementById("hud");
const playerNameInput = document.getElementById("playerName");
const roomCodeInput = document.getElementById("roomCode");
const btnCreate = document.getElementById("btnCreate");
const btnJoin = document.getElementById("btnJoin");
const btnStart = document.getElementById("btnStart");
const errorEl = document.getElementById("error");
const lobbyInfo = document.getElementById("lobbyInfo");
const codeDisplay = document.getElementById("codeDisplay");
const playerList = document.getElementById("playerList");
const playersHud = document.getElementById("playersHud");
const toastEl = document.getElementById("toast");

let myId = null;
let isHost = false;
let players = {};
let otherMeshes = {};
let gameStarted = false;

// ============ THREE.JS ============
let scene, camera, renderer, clock;
let playerMesh;          // local player body (invisible mostly)
let controls = {
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false
};
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let canJump = false;
let pitchObject, yawObject;
let isLocked = false;

const PLAYER_SPEED = 8;
const PLAYER_HEIGHT = 1.6;

function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 15, 45);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  
  // Pointer lock style controls
  pitchObject = new THREE.Object3D();
  pitchObject.add(camera);
  yawObject = new THREE.Object3D();
  yawObject.position.y = PLAYER_HEIGHT;
  yawObject.add(pitchObject);
  scene.add(yawObject);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  // Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(10, 20, 10);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  scene.add(dir);

  buildCanteen();
  setupControls();
  animate();
}

function buildCanteen() {
  // Floor
  const floorGeo = new THREE.PlaneGeometry(30, 30);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xd4a574 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e6 });
  const wallH = 4;
  const wallT = 0.3;

  // Back wall
  const back = new THREE.Mesh(new THREE.BoxGeometry(30, wallH, wallT), wallMat);
  back.position.set(0, wallH/2, -10);
  back.castShadow = true;
  scene.add(back);

  // Left wall
  const left = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, 20), wallMat);
  left.position.set(-15, wallH/2, 0);
  scene.add(left);

  // Right wall
  const right = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, 20), wallMat);
  right.position.set(15, wallH/2, 0);
  scene.add(right);

  // Counter (tezgah)
  const counterMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
  const counter = new THREE.Mesh(new THREE.BoxGeometry(8, 1.1, 1.2), counterMat);
  counter.position.set(0, 0.55, -3);
  counter.castShadow = true;
  counter.receiveShadow = true;
  scene.add(counter);

  // Counter top
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(8.2, 0.08, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x5c4033 })
  );
  top.position.set(0, 1.14, -3);
  scene.add(top);

  // Shelves
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
  for (let i = 0; i < 3; i++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(3, 0.15, 0.8), shelfMat);
    shelf.position.set(-10, 0.8 + i * 0.7, -8);
    scene.add(shelf);
  }

  // Tables
  const tableMat = new THREE.MeshStandardMaterial({ color: 0xc4a35a });
  const positions = [
    [-6, 0, 2], [6, 0, 2], [-6, 0, 6], [6, 0, 6], [0, 0, 8]
  ];
  positions.forEach(([x, y, z]) => {
    // Table top
    const t = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 1.2), tableMat);
    t.position.set(x, 0.75, z);
    t.castShadow = true;
    scene.add(t);
    // Legs
    for (let lx of [-0.9, 0.9]) {
      for (let lz of [-0.45, 0.45]) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.75, 0.1),
          new THREE.MeshStandardMaterial({ color: 0x5c4033 })
        );
        leg.position.set(x + lx, 0.375, z + lz);
        scene.add(leg);
      }
    }
  });

  // Simple decorative boxes (food display)
  const foodColors = [0xff6b6b, 0xffd93d, 0x6bcb77, 0x4d96ff];
  for (let i = 0; i < 6; i++) {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.3, 0.4),
      new THREE.MeshStandardMaterial({ color: foodColors[i % 4] })
    );
    box.position.set(-3 + i * 1.1, 1.3, -3);
    scene.add(box);
  }

  // Ceiling lights (simple)
  for (let x of [-6, 0, 6]) {
    const light = new THREE.PointLight(0xfff5e0, 0.5, 12);
    light.position.set(x, 3.5, 0);
    scene.add(light);
  }
}

function createPlayerMesh(color) {
  const group = new THREE.Group();

  // Body
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.35, 0.8, 4, 8),
    new THREE.MeshStandardMaterial({ color })
  );
  body.position.y = 0.9;
  body.castShadow = true;
  group.add(body);

  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xffdbac })
  );
  head.position.y = 1.7;
  group.add(head);

  return group;
}

function setupControls() {
  document.addEventListener("keydown", (e) => {
    switch (e.code) {
      case "KeyW": controls.moveForward = true; break;
      case "KeyS": controls.moveBackward = true; break;
      case "KeyA": controls.moveLeft = true; break;
      case "KeyD": controls.moveRight = true; break;
      case "KeyE": tryInteract(); break;
      case "Escape":
        document.exitPointerLock();
        break;
    }
  });
  document.addEventListener("keyup", (e) => {
    switch (e.code) {
      case "KeyW": controls.moveForward = false; break;
      case "KeyS": controls.moveBackward = false; break;
      case "KeyA": controls.moveLeft = false; break;
      case "KeyD": controls.moveRight = false; break;
    }
  });

  renderer.domElement.addEventListener("click", () => {
    if (gameStarted) renderer.domElement.requestPointerLock();
  });

  document.addEventListener("pointerlockchange", () => {
    isLocked = document.pointerLockElement === renderer.domElement;
  });

  document.addEventListener("mousemove", (e) => {
    if (!isLocked) return;
    const movementX = e.movementX || 0;
    const movementY = e.movementY || 0;

    yawObject.rotation.y -= movementX * 0.002;
    pitchObject.rotation.x -= movementY * 0.002;
    pitchObject.rotation.x = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, pitchObject.rotation.x));
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function tryInteract() {
  // Simple distance check to counter
  const distToCounter = Math.sqrt(
    yawObject.position.x ** 2 + (yawObject.position.z + 3) ** 2
  );
  if (distToCounter < 3.5) {
    socket.emit("interact", {
      type: "counter",
      message: "tezgaha yaklaştı"
    });
    showToast("Tezgahla etkileşim! (+5 puan)");
  } else {
    showToast("Yakınında etkileşimli bir şey yok");
  }
}

function updatePlayer(delta) {
  if (!isLocked) return;

  velocity.x -= velocity.x * 8.0 * delta;
  velocity.z -= velocity.z * 8.0 * delta;

  direction.z = Number(controls.moveForward) - Number(controls.moveBackward);
  direction.x = Number(controls.moveRight) - Number(controls.moveLeft);
  direction.normalize();

  if (controls.moveForward || controls.moveBackward) velocity.z -= direction.z * PLAYER_SPEED * delta;
  if (controls.moveLeft || controls.moveRight) velocity.x -= direction.x * PLAYER_SPEED * delta;

  // Apply rotation
  const speed = new THREE.Vector3();
  speed.x = velocity.x;
  speed.z = velocity.z;
  speed.applyAxisAngle(new THREE.Vector3(0, 1, 0), yawObject.rotation.y);

  yawObject.position.x += speed.x * delta * 12;
  yawObject.position.z += speed.z * delta * 12;

  // Simple bounds
  yawObject.position.x = Math.max(-14, Math.min(14, yawObject.position.x));
  yawObject.position.z = Math.max(-9, Math.min(12, yawObject.position.z));

  // Send position
  if (gameStarted) {
    socket.emit("move", {
      x: yawObject.position.x,
      y: yawObject.position.y,
      z: yawObject.position.z,
      rotY: yawObject.rotation.y
    });
  }
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  updatePlayer(delta);
  renderer.render(scene, camera);
}

// ============ UI / SOCKET ============
function showError(msg) {
  errorEl.textContent = msg;
  setTimeout(() => errorEl.textContent = "", 3000);
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2200);
}

function updateLobbyPlayers(list) {
  playerList.innerHTML = "";
  list.forEach(p => {
    const li = document.createElement("li");
    li.textContent = p.name + (p.id === myId ? " (Sen)" : "");
    playerList.appendChild(li);
  });
  if (isHost) btnStart.classList.remove("hidden");
}

function updatePlayersHud() {
  playersHud.innerHTML = Object.values(players).map(p =>
    `<div>${p.name}${p.id === myId ? " (Sen)" : ""} — ${p.score || 0}p</div>`
  ).join("");
}

function addOtherPlayer(p) {
  if (p.id === myId || otherMeshes[p.id]) return;
  const mesh = createPlayerMesh(p.color || "#38bdf8");
  mesh.position.set(p.x, 0, p.z);
  scene.add(mesh);
  otherMeshes[p.id] = mesh;
}

function removeOtherPlayer(id) {
  if (otherMeshes[id]) {
    scene.remove(otherMeshes[id]);
    delete otherMeshes[id];
  }
}

// Socket events
socket.on("connect", () => { myId = socket.id; });

socket.on("roomCreated", ({ code, players: plist, myId: id }) => {
  myId = id;
  isHost = true;
  players = {};
  plist.forEach(p => players[p.id] = p);
  codeDisplay.textContent = code;
  lobbyInfo.classList.remove("hidden");
  updateLobbyPlayers(plist);
});

socket.on("joinedRoom", ({ code, players: plist, myId: id }) => {
  myId = id;
  isHost = false;
  players = {};
  plist.forEach(p => players[p.id] = p);
  codeDisplay.textContent = code;
  lobbyInfo.classList.remove("hidden");
  updateLobbyPlayers(plist);
});

socket.on("playerJoined", ({ players: plist, newPlayer }) => {
  players = {};
  plist.forEach(p => players[p.id] = p);
  updateLobbyPlayers(plist);
  if (gameStarted) addOtherPlayer(newPlayer);
  showToast(newPlayer.name + " katıldı");
});

socket.on("playerLeft", ({ id, players: plist }) => {
  delete players[id];
  removeOtherPlayer(id);
  if (!gameStarted) updateLobbyPlayers(plist || Object.values(players));
  updatePlayersHud();
});

socket.on("gameStarted", ({ players: plist }) => {
  gameStarted = true;
  players = {};
  plist.forEach(p => players[p.id] = p);

  lobby.classList.remove("active");
  hud.classList.remove("hidden");

  // Spawn local player
  const me = players[myId];
  if (me) {
    yawObject.position.set(me.x || 0, PLAYER_HEIGHT, me.z || 6);
  }

  // Add other players
  plist.forEach(p => {
    if (p.id !== myId) addOtherPlayer(p);
  });

  updatePlayersHud();
  showToast("Kantinin içindesin! WASD + Mouse");
  // Auto lock
  setTimeout(() => renderer.domElement.requestPointerLock(), 300);
});

socket.on("playerMoved", ({ id, x, y, z, rotY }) => {
  if (otherMeshes[id]) {
    otherMeshes[id].position.x = x;
    otherMeshes[id].position.z = z;
    otherMeshes[id].rotation.y = rotY;
  }
  if (players[id]) {
    players[id].x = x;
    players[id].z = z;
  }
});

socket.on("interaction", ({ playerName, message }) => {
  showToast(`${playerName} ${message}`);
  if (players[myId]) updatePlayersHud();
});

socket.on("error", ({ message }) => showError(message));

// Buttons
btnCreate.onclick = () => {
  const name = playerNameInput.value.trim() || "Oyuncu";
  if (name.length < 2) return showError("İsim en az 2 karakter");
  socket.emit("createRoom", { playerName: name });
};

btnJoin.onclick = () => {
  const name = playerNameInput.value.trim() || "Oyuncu";
  const code = roomCodeInput.value.trim();
  if (name.length < 2) return showError("İsim en az 2 karakter");
  if (code.length !== 4) return showError("4 haneli kod gir");
  socket.emit("joinRoom", { code, playerName: name });
};

btnStart.onclick = () => socket.emit("startGame");

// Start Three.js immediately (behind lobby)
initThree();
