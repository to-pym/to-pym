// 1. Configuración de Supabase (Cita: Configuración basada en tus credenciales previas)
const supabaseUrl = 'https://uidtftexrehuvorfxyzc.supabase.co';
const supabaseKey = 'sb_publishable_UFUtQWoMdZM_ePLHddBspQ_MNihJuwm';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// 2. Elementos del DOM
const audioPlayer = document.getElementById('audioPlayer');
const albumArtPlayer = document.getElementById('albumArt');
const playerTrackTitle = document.getElementById('playerTrackTitle');
const playerTrackArtist = document.getElementById('playerTrackArtist');
const lyricsContainer = document.getElementById('lyricsContainer');
const backgroundVideo = document.getElementById('backgroundVideo');

const playerProgressBar = document.getElementById('playerProgressBar');
const playerProgressBarContainer = document.getElementById('playerProgressBarContainer');
const playerCurrentTime = document.getElementById('playerCurrentTime');
const playerTotalDuration = document.getElementById('playerTotalDuration');

const playerPlayPauseBtn = document.getElementById('playerPlayPauseBtn');
const playerVolumeSlider = document.getElementById('playerVolumeSlider');
const playerSpeedSlider = document.getElementById('playerSpeedSlider');
const currentSpeedDisplay = document.getElementById('currentSpeedDisplay');

let isPlaying = false;

// 3. Cargar canción desde la tabla 'daily_songs'
async function loadSong() {
    try {
        // Consultamos la tabla 'daily_songs' vista en tu captura de pantalla
        const { data: song, error } = await supabaseClient
            .from('daily_songs')
            .select('*')
            .limit(1)
            .single();

        if (error) throw error;

        if (song) {
            // Asignación de datos según las columnas de tu tabla
            playerTrackTitle.textContent = song.title;
            playerTrackArtist.textContent = song.artist;
            albumArtPlayer.src = song.cover_url; // Columna 'cover_url' de la captura
            audioPlayer.src = song.audio_url;   // Columna 'audio_url' de la captura

            // Procesar las letras (Columna 'lyrics' de la captura)
            parseAndRenderLyrics(song.lyrics);
        }
    } catch (error) {
        console.error('Error al cargar la canción:', error.message);
        playerTrackTitle.textContent = "Error de conexión";
    }
}

// 4. Parser de letras para formato LRC [mm:ss.xx]
function parseAndRenderLyrics(rawLyrics) {
    lyricsContainer.innerHTML = '';
    if (!rawLyrics) return;

    // Dividimos por líneas y buscamos el formato de tiempo visto en tu DB
    const lines = rawLyrics.split('\n');
    lines.forEach(line => {
        const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseFloat(match[2]);
            const timeInSeconds = minutes * 60 + seconds;
            const text = match[3].trim();
            
            if (text) {
                const span = document.createElement('span');
                span.textContent = text;
                span.setAttribute('data-time', timeInSeconds);
                span.classList.add('lyric-line');
                lyricsContainer.appendChild(span);
            }
        }
    });
}

// 5. Lógica del Reproductor
function togglePlay() {
    if (isPlaying) {
        audioPlayer.pause();
        playerPlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        audioPlayer.play();
        playerPlayPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
    isPlaying = !isPlaying;
}

audioPlayer.addEventListener('timeupdate', () => {
    if (audioPlayer.duration) {
        // Barra de progreso
        const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        playerProgressBar.style.width = `${progressPercent}%`;
        playerCurrentTime.textContent = formatTime(audioPlayer.currentTime);

        // Sincronización de letras
        const currentTime = audioPlayer.currentTime;
        const lyricLines = document.querySelectorAll('.lyric-line');
        
        lyricLines.forEach((line, index) => {
            const lineTime = parseFloat(line.getAttribute('data-time'));
            let nextLineTime = Infinity;
            
            if (index + 1 < lyricLines.length) {
                nextLineTime = parseFloat(lyricLines[index + 1].getAttribute('data-time'));
            }

            if (currentTime >= lineTime && currentTime < nextLineTime) {
                line.classList.add('highlight');
                line.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                line.classList.remove('highlight');
            }
        });
    }
});

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// Event Listeners
playerPlayPauseBtn.addEventListener('click', togglePlay);

playerProgressBarContainer.addEventListener('click', (e) => {
    const width = playerProgressBarContainer.clientWidth;
    const clickX = e.offsetX;
    audioPlayer.currentTime = (clickX / width) * audioPlayer.duration;
});

playerVolumeSlider.addEventListener('input', (e) => {
    audioPlayer.volume = e.target.value;
});

playerSpeedSlider.addEventListener('input', (e) => {
    const speed = parseFloat(e.target.value);
    audioPlayer.playbackRate = speed;
    currentSpeedDisplay.textContent = `${speed.toFixed(2)}x`;
});

// Iniciar carga
window.onload = loadSong;
