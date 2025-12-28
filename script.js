const CLIP_LENGTH = 5;
const INTRO_OFFSET = 85;

const audio = document.getElementById("audio");
const playBtn = document.getElementById("play");
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

let mode = "daily"; // "daily" | "random"

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

/* ---------------- Seeded randomness ---------------- */

function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function dailySeed() {
  const today = new Date();
  return parseInt(
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0")
  );
}

function getRandom() {
  return mode === "daily"
    ? mulberry32(dailySeed())
    : Math.random;
}

/* ---------------- Play logic ---------------- */

playBtn.addEventListener("click", () => {
  if (!audioFiles.length) return;

  // Reset UI
  revealBtn.disabled = false;
  metadataBox.hidden = true;
  thumbEl.style.display = "none";

  audio.pause();
  audio.currentTime = 0;

  const rand = getRandom();

  // Pick episode deterministically or randomly
  const fileIndex = Math.floor(rand() * audioFiles.length);
  currentFile = audioFiles[fileIndex];

  audio.src = `opus/${currentFile}`;

  audio.onloadedmetadata = () => {
    const minStart = Math.min(INTRO_OFFSET, audio.duration - CLIP_LENGTH);
    const maxStart = Math.max(minStart, audio.duration - CLIP_LENGTH);

    currentStartTime = minStart + rand() * (maxStart - minStart);

    audio.currentTime = currentStartTime;
    audio.play();

    setTimeout(() => audio.pause(), CLIP_LENGTH * 1000);
  };
});

/* ---------------- Reveal metadata ---------------- */

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

  // Load thumbnail
  if (result["Thumbnail"]) {
    thumbEl.src = result["Thumbnail"];
    thumbEl.style.display = "block";
  } else {
    thumbEl.style.display = "none";
  }

  metadataBox.hidden = false;
});
