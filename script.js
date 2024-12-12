// script.js
const audioFileInput = document.getElementById('audioFile');
const canvas = document.getElementById('visualizer');
const canvasContext = canvas.getContext('2d');
const playPauseButton = document.getElementById('playPause');
const volumeControl = document.getElementById('volume');
const speedControl = document.getElementById('speed');
const themeSelect = document.getElementById('theme');
const themeToggle = document.getElementById('themeToggle');

let audioContext, audioBuffer, sourceNode, analyser, animationId;
let isPlaying = false;

// Initialize Theme
document.body.classList.add('light');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light');
});

// Audio Controls
audioFileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!audioContext) {
        audioContext = new AudioContext();
    }

    if (sourceNode) {
        stopAudio();
    }

    const fileData = await file.arrayBuffer();
    audioBuffer = await audioContext.decodeAudioData(fileData);

    playPauseButton.disabled = false;
});

playPauseButton.addEventListener('click', () => {
    isPlaying ? stopAudio() : playAudio();
});

volumeControl.addEventListener('input', () => {
    if (audioContext) {
        audioContext.destination.gain.value = volumeControl.value;
    }
});

speedControl.addEventListener('input', () => {
    if (sourceNode) {
        sourceNode.playbackRate.value = speedControl.value;
    }
});

function playAudio() {
    if (!audioBuffer) return;

    sourceNode = audioContext.createBufferSource();
    analyser = audioContext.createAnalyser();
    sourceNode.buffer = audioBuffer;

    sourceNode.connect(analyser);
    analyser.connect(audioContext.destination);

    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    sourceNode.start(0);
    isPlaying = true;
    playPauseButton.textContent = 'Pause';

    function draw() {
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);

        analyser.getByteTimeDomainData(dataArray);

        canvasContext.lineWidth = 2;
        canvasContext.strokeStyle = 'lightblue';

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        canvasContext.beginPath();
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * canvas.height) / 2;

            canvasContext.lineTo(x, y);
            x += sliceWidth;
        }
        canvasContext.stroke();

        animationId = requestAnimationFrame(draw);
    }
    draw();
}

function stopAudio() {
    if (sourceNode) {
        sourceNode.stop();
        sourceNode.disconnect();
        analyser.disconnect();
    }
    cancelAnimationFrame(animationId);
    isPlaying = false;
    playPauseButton.textContent = 'Play';
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
}
