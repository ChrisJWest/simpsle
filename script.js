const CLIP_LENGTH = 5;

const audio = document.getElementById("audio");
const playBtn = document.getElementById("play");
const revealBtn = document.getElementById("reveal");

const thumbnail = document.getElementById("thumbnail");
const titleEl = document.getElementById("title");
const descEl = document.getElementById("description");
const metadataBox = document.getElementById("metadata");

let audioFiles = [];
let metadata = {};
let currentFile = null;

// Load manifests
Promise.all([
  fetch("audios.json").then(r => r.json()),
  fetch("episode_data.json").then(r => r.json())
]).then(([files, data]) => {
  audioFiles = files;
  metadata = data;
});

// Pick random audio filename
function randomFile() {
  return audioFiles[Math.floor(Math.random() * audioFiles.length)];
}

playBtn.addEventListener("click", () => {
  if (!audioFiles.length) return;

  // Reset UI
  revealBtn.disabled = false;
  metadataBox.hidden = true;

  currentFile = randomFile();
  audio.src = `opus/${currentFile}`;

  // Show thumbnail immediately (if available)
  const info = metadata[currentFile];
  if (info?.thumbnail) {
    thumbnail.src = info.thumbnail;
    thumbnail.hidden = false;
  } else {
    thumbnail.hidden = true;
  }

  audio.onloadedmetadata = () => {
    const maxStart = Math.max(0, audio.duration - CLIP_LENGTH);
    audio.currentTime = Math.random() * maxStart;
    audio.play();

    setTimeout(() => audio.pause(), CLIP_LENGTH * 1000);
  };
});

const thumbEl = document.getElementById("episode-thumbnail");

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

  titleEl.textContent = "S" + seasonNum + "E" + epNum + ": " + result["Episode Title"] || "";
  descEl.textContent = result["Episode Description"] || "";

  // ✅ Load thumbnail image
  if (result["Thumbnail"]) {
    thumbEl.src = result["Thumbnail"];
    thumbEl.style.display = "block";
  } else {
    thumbEl.style.display = "none";
  }

  metadataBox.hidden = false;
});
