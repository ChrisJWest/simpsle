const CLIP_LENGTH = 5;
const audio = document.getElementById("audio");
const button = document.getElementById("play");

let audioFiles = [];

// Load the manifest
fetch("audios.json")
  .then(res => res.json())
  .then(files => {
    audioFiles = files;
  });

function randomAudioFile() {
  const file = audioFiles[Math.floor(Math.random() * audioFiles.length)];
  return `opus/${file}`;
}

button.addEventListener("click", () => {
  if (!audioFiles.length) return;

  audio.pause();
  audio.src = randomAudioFile();

  audio.onloadedmetadata = () => {
    const maxStart = Math.max(0, audio.duration - CLIP_LENGTH);
    audio.currentTime = Math.random() * maxStart;
    audio.play();

    setTimeout(() => audio.pause(), CLIP_LENGTH * 1000);
  };
});
