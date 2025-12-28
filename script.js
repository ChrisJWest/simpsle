const BASE_CLIP = 5;
const ADD_INCREMENT = 5;
const MAX_ADDS = 5;
const INTRO_OFFSET = 85;
const END_OFFSET = 90;

const audio = document.getElementById("audio");
const playBtn = document.getElementById("play");
const addBtn = document.getElementById("add-time");
const revealBtn = document.getElementById("reveal");

const thumbnail = document.getElementById("thumbnail");
const titleEl = document.getElementById("title");
const descEl = document.getElementById("description");
const metadataBox = document.getElementById("metadata");
const thumbEl = document.getElementById("episode-thumbnail");

let audioFiles = [];
let metadata = {};
let currentFile = null;
let currentStartTime = 0;

let addedTime = 0;
let addCount = 0;

let mode = "daily";

const dailyBtn = document.getElementById("daily");
const randomBtn = document.getElementById("random");

dailyBtn.onclick = () => {
  mode = "daily";
  dailyBtn.classList.add("active");
  randomBtn.classList.remove("active");
};

randomBtn.onclick = () => {
  mode = "random";
  randomBtn.classList.add("active");
  dailyBtn.classList.remove("active");
};

// Load manifests
Promise.all([
  fetch("audios.json").then(r => r.json()),
  fetch("episode_data.json").then(r => r.json())
]).then(([files, data]) => {
  audioFiles = files;
  metadata = data;
});

/* ---------- Seeded randomness ---------- */

function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function dailySeed() {
  const d = new Date();
  return parseInt(
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0")
  );
}

function getRandom() {
  return mode === "daily"
    ? mulberry32(dailySeed())
    : Math.random;
}

/* ---------- Helpers ---------- */

function updatePlayButton() {
  if (addedTime === 0) {
    playBtn.textContent = "Play (5s)";
  } else {
    playBtn.textContent = `Play (5+${addedTime}s)`;
  }
}

function resetAddState() {
  addedTime = 0;
  addCount = 0;
  addBtn.disabled = false;
  updatePlayButton();
}

/* ---------- Play ---------- */

playBtn.addEventListener("click", () => {
  if (!audioFiles.length) return;

  revealBtn.disabled = false;
  metadataBox.hidden = true;
  thumbEl.style.display = "none";

  audio.pause();

  // New episode = reset add time
  resetAddState();

  const rand = getRandom();
  const fileIndex = Math.floor(rand() * audioFiles.length);
  currentFile = audioFiles[fileIndex];

  audio.src = `opus/${currentFile}`;

  audio.onloadedmetadata = () => {
    const minStart = INTRO_OFFSET;
    const maxStart = Math.max(
      minStart,
      audio.duration - END_OFFSET - BASE_CLIP
    );

    currentStartTime = minStart + rand() * (maxStart - minStart);

    audio.currentTime = currentStartTime;
    audio.play();

    setTimeout(() => audio.pause(), BASE_CLIP * 1000);
  };
});

/* ---------- Add 5 seconds ---------- */

addBtn.addEventListener("click", () => {
  if (!currentFile) return;
  if (addCount >= MAX_ADDS) return;

  addCount++;
  addedTime += ADD_INCREMENT;

  if (addCount >= MAX_ADDS) {
    addBtn.disabled = true;
  }

  updatePlayButton();

  // Replay with extended duration
  audio.currentTime = currentStartTime;
  audio.play();

  const totalDuration = BASE_CLIP + addedTime;

  setTimeout(() => audio.pause(), totalDuration * 1000);
});

/* ---------- Reveal ---------- */

revealBtn.addEventListener("click", () => {
  if (!currentFile) return;

  const seasonNum = currentFile.substring(1, 3);
  const epNum = String(parseInt(currentFile.substring(7, 9)));

  const seasonData = metadata[seasonNum];
  if (!seasonData) return;

  const result = seasonData.find(
    ep => ep["Episode Number"] === epNum
  );
  if (!result) return;

  titleEl.textContent =
    `S${seasonNum}E${epNum}: ${result["Episode Title"]}` || "";

  descEl.textContent = result["Episode Description"] || "";

  if (result["Thumbnail"]) {
    thumbEl.src = result["Thumbnail"];
    thumbEl.style.display = "block";
  } else {
    thumbEl.style.display = "none";
  }

  metadataBox.hidden = false;
});
