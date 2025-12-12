// DOM Elements - only get what we need initially
let audio, playBtn, prevBtn, nextBtn, progress, progressBar;
let currentTimeEl, durationEl, trackTitle, trackArtist, trackCover, trackList;
let navToggle, navMenu, contactForm;

// vsechno je to ai no tak co jako ale ta hudba je real
const playlist = [
    {
        title: 'BEEN THERE, DONE THAT',
        artist: 'D0ndrripp (prod. Brst)',
        duration: '1:46',
        cover: 'assets/images/kominik.png',
        src: 'assets/audio/danrapp.mp3'
    },
    {
        title: '"DEMO" Tak co furt hledáš ve svý (hlavě)',
        artist: 'Frantisek Macak (Brst)',
        duration: '3:04',
        cover: 'assets/images/obrazek.png',
        src: 'assets/audio/takco.mp3'
    },
    {
        title: 'Tekkenn',
        artist: 'ILWSM',
        duration: '3:46',
        cover: 'assets/images/Tekkenn.jpg',
        src: 'assets/audio/Tekkenn.wav'
    },
    {
        title: 'Space',
        artist: 'ILWSM',
        duration: '3:56',
        cover: 'assets/images/space.png',
        src: 'assets/audio/space-ilwsm.mp3'
    }
];

// Simple silent audio for demonstration (very small)
const SILENT_AUDIO = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAD///////8=";

let currentTrackIndex = 0;
let isPlaying = false;

// Lazy load DOM elements when needed
function initDOMElements() {
    if (!audio) {
        audio = document.getElementById('audio');
        playBtn = document.getElementById('playBtn');
        prevBtn = document.getElementById('prevBtn');
        nextBtn = document.getElementById('nextBtn');
        progress = document.getElementById('progress');
        progressBar = document.querySelector('.progress-bar');
        currentTimeEl = document.getElementById('currentTime');
        durationEl = document.getElementById('duration');
        trackTitle = document.getElementById('trackTitle');
        trackArtist = document.getElementById('trackArtist');
        trackCover = document.getElementById('trackCover');
        trackList = document.getElementById('trackList');
        navToggle = document.getElementById('mobile-menu');
        navMenu = document.querySelector('.nav-menu');
        contactForm = document.getElementById('contactForm');
    }
}

// Build playlist DOM from the playlist array so each item shows title, artist and cover thumbnail
function buildTrackListFromPlaylist() {
    initDOMElements();
    if (!trackList) return;

    // Clear any static items in index.html
    trackList.innerHTML = '';

    playlist.forEach((t, idx) => {
        const item = document.createElement('div');
        item.className = 'track-item';
        item.setAttribute('data-src', t.src || '');

        // Thumbnail (fallback handled by onerror)
        const thumbHtml = `
            <div class="track-thumb-container" style="width:48px;height:48px;border-radius:6px;overflow:hidden;margin-right:10px;">
                <img src="${t.cover || ''}" alt="${t.title} cover" class="track-thumb" style="width:100%;height:100%;object-fit:cover;display:block;">
            </div>
        `;

        item.innerHTML = `
            <div style="display:flex;align-items:center;">
                ${thumbHtml}
                <div style="flex:1;min-width:0;">
                    <div class="track-name" style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.title}</div>
                    <div class="track-artist-small" style="font-size:0.85rem;color:var(--muted,#666);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.artist}</div>
                </div>
                <div class="track-duration" style="margin-left:12px;color:var(--muted,#666);">${t.duration || ''}</div>
                <button class="play-track-btn" style="margin-left:12px;border:none;background:transparent;cursor:pointer;">
                    <i class="fas fa-play"></i>
                </button>
            </div>
        `;

        // Attach click handlers
        const playBtnLocal = item.querySelector('.play-track-btn');

        // Row click: toggle play/pause if clicking same track, otherwise load+play new track
        item.addEventListener('click', () => {
            if (currentTrackIndex === idx) {
                togglePlay();
            } else {
                currentTrackIndex = idx;
                loadTrack(idx);
                playTrack();
            }
        });

        if (playBtnLocal) {
            playBtnLocal.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentTrackIndex === idx) {
                    togglePlay();
                } else {
                    currentTrackIndex = idx;
                    loadTrack(idx);
                    playTrack();
                }
            });
        }

        // If cover image fails, hide it (player will show placeholder)
        const img = item.querySelector('.track-thumb');
        if (img) {
            img.addEventListener('error', () => {
                img.style.display = 'none';
            });
        }

        trackList.appendChild(item);
    });

    // Ensure active styling is correct after build
    updateActiveTrack(currentTrackIndex);
}

// Initialize the music player
function initPlayer() {
    initDOMElements();

    // Rebuild the playlist DOM so each track shows artist + cover
    buildTrackListFromPlaylist();

    // Load the first track info (without audio)
    updateTrackDisplay(currentTrackIndex);

    // Set up event listeners
    setupEventListeners();
}

// Update track display without loading audio immediately
function updateTrackDisplay(index) {
    const track = playlist[index];

    if (trackTitle) trackTitle.textContent = track.title;
    if (trackArtist) trackArtist.textContent = track.artist;

    // Handle cover image with local fallback
    if (trackCover) {
        // Reset previous state
        trackCover.style.display = 'block';
        const existingPlaceholder = trackCover.parentElement.querySelector('.cover-placeholder');
        if (existingPlaceholder) {
            existingPlaceholder.style.display = 'none';
        }

        trackCover.src = track.cover;
        trackCover.onerror = function() {
            // Hide the broken image
            this.style.display = 'none';

            // Show or create CSS-based placeholder
            let placeholder = this.parentElement.querySelector('.cover-placeholder');
            if (!placeholder) {
                placeholder = document.createElement('div');
                placeholder.className = 'cover-placeholder';
                this.parentElement.appendChild(placeholder);
            }

            const colors = ['#4ecdc4', '#ff6b6b', '#45b7d1', '#96ceb4'];
            const initials = (track.title || '').split(' ').map(word => word[0] || '').join('').substring(0, 2);

            placeholder.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 80px;
                height: 80px;
                border-radius: 10px;
                background: linear-gradient(45deg, ${colors[index % colors.length]}, ${colors[(index + 1) % colors.length]});
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 1.2rem;
                z-index: 2;
            `;
            placeholder.textContent = initials || '♪';
            placeholder.style.display = 'flex';
        };

        trackCover.onload = function() {
            // Show real image and hide placeholder
            this.style.display = 'block';
            const placeholder = this.parentElement.querySelector('.cover-placeholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
        };
    }

    // Update active track in playlist
    updateActiveTrack(index);
}

// Load audio only when needed (when user tries to play)
function loadTrack(index) {
    const track = playlist[index];

    if (audio) {
        // Reset audio element so it will be loaded when play is requested
        // But avoid unnecessary reset if the same source is already set
        if (!audio.src || audio.src.indexOf(track.src) === -1) {
            audio.removeAttribute('src');
            audio.load(); // Reset audio element
        }
    }

    updateTrackDisplay(index);
}

// Check if audio file exists before playing
async function checkAudioExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Update the active track styling in playlist
function updateActiveTrack(index) {
    const trackItems = document.querySelectorAll('.track-item');
    trackItems.forEach((item, i) => {
        const btnIcon = item.querySelector('.play-track-btn i');
        if (i === index) {
            item.classList.add('active');
            if (btnIcon) btnIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
        } else {
            item.classList.remove('active');
            if (btnIcon) btnIcon.className = 'fas fa-play';
        }
    });
}

// Play/Pause functionality
function togglePlay() {
    if (isPlaying) {
        pauseTrack();
    } else {
        playTrack();
    }
}

function playTrack() {
    initDOMElements();

    const track = playlist[currentTrackIndex];

    // First, try to load the actual audio file
    if (!audio.src || audio.src === window.location.href || audio.src === SILENT_AUDIO || audio.src.indexOf(track.src) === -1) {
        // Check if the audio file exists
        checkAudioExists(track.src).then(exists => {
            if (exists) {
                // File exists, load and play it
                audio.src = track.src;
                attemptPlay();
            } else {
                // File doesn't exist, use silent placeholder
                console.log('Audio file not found:', track.src);
                audio.src = SILENT_AUDIO;
                if (trackTitle) {
                    trackTitle.textContent = `${track.title} (Add ${track.src.split('/').pop()} to play)`;
                }
                attemptPlay();
            }
        }).catch(() => {
            // Network error or other issue, use placeholder
            audio.src = SILENT_AUDIO;
            if (trackTitle) {
                trackTitle.textContent = `${track.title} (Demo mode - Add MP3 files)`;
            }
            attemptPlay();
        });
    } else {
        attemptPlay();
    }
}

function attemptPlay() {
    const playPromise = audio.play();

    if (playPromise !== undefined) {
        playPromise.then(() => {
            isPlaying = true;
            if (playBtn) playBtn.innerHTML = '<i class="fas fa-pause"></i>';

            // Update playlist UI
            updateActiveTrack(currentTrackIndex);
        }).catch(error => {
            console.log('Play failed:', error);
            if (trackTitle) {
                trackTitle.textContent = `${playlist[currentTrackIndex].title} (Audio unavailable)`;
            }
        });
    }
}

function pauseTrack() {
    if (audio) {
        audio.pause();
        isPlaying = false;
        if (playBtn) playBtn.innerHTML = '<i class="fas fa-play"></i>';

        // Update playlist UI
        updateActiveTrack(currentTrackIndex);
    }
}

// Previous track
function prevTrack() {
    currentTrackIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : playlist.length - 1;
    loadTrack(currentTrackIndex);
    if (isPlaying) playTrack();
}

// Next track
function nextTrack() {
    currentTrackIndex = currentTrackIndex < playlist.length - 1 ? currentTrackIndex + 1 : 0;
    loadTrack(currentTrackIndex);
    if (isPlaying) playTrack();
}

// Update progress bar
function updateProgress() {
    if (!audio) return;

    const { duration, currentTime } = audio;

    if (duration && progress && currentTimeEl && durationEl) {
        const progressPercent = (currentTime / duration) * 100;
        progress.style.width = progressPercent + '%';

        // Update time displays
        currentTimeEl.textContent = formatTime(currentTime);
        durationEl.textContent = formatTime(duration);
    }
}

// Set progress
function setProgress(e) {
    if (!audio || !progressBar) return;

    const width = progressBar.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;

    if (duration) {
        audio.currentTime = (clickX / width) * duration;
    }
}

// Format time to mm:ss
function formatTime(time) {
    if (isNaN(time)) return '0:00';

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Setup all event listeners
function setupEventListeners() {
    // Player controls
    if (playBtn) playBtn.addEventListener('click', togglePlay);
    if (prevBtn) prevBtn.addEventListener('click', prevTrack);
    if (nextBtn) nextBtn.addEventListener('click', nextTrack);

    // Audio events (only set up when audio is available)
    if (audio) {
        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', nextTrack);
        audio.addEventListener('loadedmetadata', () => {
            if (durationEl && audio.duration) {
                durationEl.textContent = formatTime(audio.duration);
            }
        });

        // Sync UI with native play/pause events
        audio.addEventListener('play', () => {
            isPlaying = true;
            if (playBtn) playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            updateActiveTrack(currentTrackIndex);
        });
        audio.addEventListener('pause', () => {
            isPlaying = false;
            if (playBtn) playBtn.innerHTML = '<i class="fas fa-play"></i>';
            updateActiveTrack(currentTrackIndex);
        });

        // Clean error handling
        audio.addEventListener('error', (e) => {
            console.log('Audio error occurred');
            // Only show error if not already using placeholder
            if (audio.src !== SILENT_AUDIO) {
                if (trackTitle) {
                    trackTitle.textContent = `${playlist[currentTrackIndex].title} (File not found)`;
                }
            }
        });

        audio.addEventListener('loadstart', () => {
            // Reset title when loading real audio starts
            if (trackTitle && audio.src !== SILENT_AUDIO) {
                trackTitle.textContent = playlist[currentTrackIndex].title;
            }
        });
    }

    // Progress bar
    if (progressBar) {
        progressBar.addEventListener('click', setProgress);
    }

    // Mobile navigation
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu) navMenu.classList.remove('active');
            if (navToggle) navToggle.classList.remove('active');
        });
    });

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.code === 'Space') {
            e.preventDefault();
            togglePlay();
        } else if (e.code === 'ArrowRight') {
            nextTrack();
        } else if (e.code === 'ArrowLeft') {
            prevTrack();
        }
    });
}

// Scroll to section function (used by CTA button)
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Optimized loading animation
function showLoadingAnimation() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease-in-out';

    // Quick fade in
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
}

// Volume control wiring for #audio
(function () {
    const audio = document.getElementById('audio');
    const slider = document.getElementById('volumeSlider');
    const muteBtn = document.getElementById('muteBtn');
    const volumeIcon = document.getElementById('volumeIcon');
    if (!audio || !slider || !muteBtn) return;

    // Restore saved volume (0..1)
    const saved = localStorage.getItem('bw_volume');
    const initialVolume = (saved !== null) ? parseFloat(saved) : 1;
    audio.volume = isNaN(initialVolume) ? 1 : Math.max(0, Math.min(1, initialVolume));
    slider.value = audio.volume;

    let previousVolume = audio.volume > 0 ? audio.volume : 0.5;

    function updateIcon(vol) {
        if (vol === 0) {
            volumeIcon.className = 'fas fa-volume-mute';
        } else if (vol < 0.5) {
            volumeIcon.className = 'fas fa-volume-down';
        } else {
            volumeIcon.className = 'fas fa-volume-up';
        }
    }

    updateIcon(audio.volume);

    slider.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        audio.volume = v;
        if (v > 0) previousVolume = v;
        updateIcon(v);
        localStorage.setItem('bw_volume', String(v));
    });

    muteBtn.addEventListener('click', () => {
        if (audio.volume === 0) {
            audio.volume = previousVolume || 0.5;
            slider.value = audio.volume;
        } else {
            previousVolume = audio.volume;
            audio.volume = 0;
            slider.value = 0;
        }
        updateIcon(audio.volume);
        localStorage.setItem('bw_volume', String(audio.volume));
    });
})();

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    showLoadingAnimation();
    initPlayer();
});

// Export functions for potential external use
window.BrstWorks = {
    playTrack,
    pauseTrack,
    nextTrack,
    prevTrack,
    scrollToSection
};

// Copy-to-clipboard for donation IBAN (append to script.js)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;
  const targetId = btn.getAttribute('data-copy-target');
  const el = document.getElementById(targetId);
  if (!el) return;
  const text = el.textContent.trim();
  if (!navigator.clipboard) {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (err) {}
    document.body.removeChild(ta);
  } else {
    navigator.clipboard.writeText(text).catch(()=>{});
  }

  const original = btn.textContent;
  btn.textContent = 'Zkopírováno';
  btn.disabled = true;
  setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 1500);
});