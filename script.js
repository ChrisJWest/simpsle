// Number of audio files you have
const AUDIO_COUNT = 250;

// Length of clip in seconds
const CLIP_LENGTH = 5;

const audio = document.getElementById("audio");
const button = document.getElementById("play");

// Generate filenames like 001.opus, 002.opus, ...
function randomAudioFile() {
  const n = Math.floor(Math.random() * AUDIO_COUNT) + 1;
  return `opus/${String(n).padStart(3, "0")}.opus`;
}

button.addEventListener("click", () => {
  // Stop anything currently playing
  audio.pause();
  audio.currentTime = 0;

  // Pick a random file
  audio.src = randomAudioFile();

  audio.onloadedmetadata = () => {
    const maxStart = Math.max(0, audio.duration - CLIP_LENGTH);
    const start = Math.random() * maxStart;

    audio.currentTime = start;
    audio.play();

    setTimeout(() => {
      audio.pause();
    }, CLIP_LENGTH * 1000);
  };
});
