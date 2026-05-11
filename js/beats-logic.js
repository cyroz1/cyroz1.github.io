const CONFIG = {
    FOLDER_ID: '1LCxTPh6hYsNyXZ5dvnokackviwAKHvLi',
    API_KEY: 'AIzaSyCpy-rEO1nopWSSWFuvrWDpelidsV2gpl4',
    PAYPAL_EMAIL: 'cyrozv@gmail.com',
    DEFAULT_PRICE: 30,
    CURRENCY: 'USD',
};

const PAYPAL_ICON = `<svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/></svg>`;
const LINK_ICON = `<svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.43"/><path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.33-1.33"/></svg>`;

function beatNameFromFile(filename) {
    return filename.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[char]));
}

function paypalUrl(beatName, price) {
    const params = new URLSearchParams({
        cmd: '_xclick',
        business: CONFIG.PAYPAL_EMAIL,
        item_name: `${beatName} (Beat Lease)`,
        amount: price,
        currency_code: CONFIG.CURRENCY,
        no_shipping: '1',
    });
    return `https://www.paypal.com/cgi-bin/webscr?${params}`;
}

function driveMediaUrl(fileId) {
    return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${CONFIG.API_KEY}`;
}

function formatModifiedDate(isoString) {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function beatAnchorId(file) {
    return `beat-${String(file.id || '').replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

function showBeatToast(message) {
    let toast = document.querySelector('.beat-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'beat-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(showBeatToast.timeoutId);
    showBeatToast.timeoutId = window.setTimeout(() => {
        toast.classList.remove('is-visible');
    }, 1700);
}

function copyBeatLink(anchorId, button) {
    const url = `${window.location.origin}${window.location.pathname}#${anchorId}`;
    const setCopiedState = () => {
        const original = button.dataset.originalLabel || 'Copy beat link';
        button.setAttribute('aria-label', 'Copied beat link');
        button.title = 'Copied';
        button.classList.add('is-copied');
        showBeatToast('Beat link copied');
        window.setTimeout(() => {
            button.setAttribute('aria-label', original);
            button.title = original;
            button.classList.remove('is-copied');
        }, 1400);
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(setCopiedState).catch(() => {
            window.prompt('Copy this beat link:', url);
        });
        return;
    }

    window.prompt('Copy this beat link:', url);
}

function scrollToBeatFromHash() {
    const hash = decodeURIComponent(window.location.hash || '').replace(/^#/, '');
    document.querySelectorAll('.beat-card.is-shared').forEach(card => card.classList.remove('is-shared'));
    if (!hash) return;
    const target = document.getElementById(hash);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('is-shared');
    target.classList.add('is-highlighted');
    window.setTimeout(() => target.classList.remove('is-highlighted'), 1800);
}

function createBeatCard(file, index) {
    const name = beatNameFromFile(file.name);
    const safeName = escapeHtml(name);
    const price = CONFIG.DEFAULT_PRICE;
    const previewSrc = driveMediaUrl(file.id);
    const dateStr = formatModifiedDate(file.modifiedTime);
    const anchorId = beatAnchorId(file);

    const card = document.createElement('div');
    card.className = 'beat-card';
    card.id = anchorId;
    card.style.setProperty('--delay', index);

    card.innerHTML = `
        <button class="btn-copy" type="button" data-anchor-id="${anchorId}" aria-label="Copy beat link" title="Copy beat link">
            ${LINK_ICON}
        </button>
        <span class="shared-beat-label">Shared beat</span>
        <div class="beat-header">
            <span class="beat-name">${safeName}</span>
            <span class="beat-price">$${price}</span>
        </div>
        <div class="beat-meta">
            <span class="beat-tag">Beat Lease</span>
            ${dateStr ? `<span class="beat-date">${dateStr}</span>` : ''}
        </div>
        <div class="beat-player-wrapper custom-player" data-src="${previewSrc}" data-title="${safeName}">
            <button class="player-button" type="button" aria-label="Play ${safeName}">
                <span class="play-icon"></span>
            </button>
            <div class="player-main">
                <canvas class="visualizer" width="320" height="52" aria-hidden="true"></canvas>
                <div class="player-progress" role="slider" aria-label="${safeName} progress" aria-valuemin="0"
                    aria-valuemax="100" aria-valuenow="0" tabindex="0">
                    <span class="progress-fill"></span>
                </div>
            </div>
            <span class="player-time">0:00</span>
        </div>
        <div class="beat-actions">
            <a class="btn-buy" href="${paypalUrl(name, price)}" target="_blank" rel="noopener noreferrer">
                ${PAYPAL_ICON} Lease - $${price}
            </a>
        </div>
    `;
    return card;
}

async function loadBeats() {
    const grid = document.getElementById('beatsGrid');
    const loading = document.getElementById('beatsLoading');
    try {
        const apiUrl = `https://www.googleapis.com/drive/v3/files?` +
            `q='${CONFIG.FOLDER_ID}'+in+parents+and+trashed=false` +
            `&key=${CONFIG.API_KEY}&fields=files(id,name,mimeType,modifiedTime)` +
            `&orderBy=modifiedTime+desc&pageSize=100`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const data = await res.json();
        const audioFiles = (data.files || []).filter(f =>
            f.mimeType && (f.mimeType.startsWith('audio/') || f.name.match(/\.(mp3|wav|flac|ogg|m4a|aac)$/i))
        );
        loading.remove();
        if (audioFiles.length === 0) {
            grid.innerHTML = `<div class="beats-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg><p>No beats available right now. Check back soon!</p></div>`;
            return;
        }
        const fragment = document.createDocumentFragment();
        audioFiles.forEach((file, i) => fragment.appendChild(createBeatCard(file, i)));
        grid.appendChild(fragment);
        initPlayers();
        bindCopyButtons();
        scrollToBeatFromHash();
    } catch (err) {
        console.error('Failed to load beats:', err);
        loading.innerHTML = `<div class="beats-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>Couldn't load beats. Please try again later.</p></div>`;
    }
}


function bindCopyButtons() {
    const copyButtons = document.querySelectorAll('.btn-copy');
    copyButtons.forEach(button => {
        button.dataset.originalLabel = button.getAttribute('aria-label') || 'Copy beat link';
        button.addEventListener('click', () => {
            const anchorId = button.dataset.anchorId;
            if (!anchorId) return;
            copyBeatLink(anchorId, button);
        });
    });
}

function initPlayers() {
    const wrappers = document.querySelectorAll('.beat-player-wrapper');
    const activePlayers = new Map();
    let currentWrapper = null;
    let audioContext = null;
    let analyser = null;
    let sourceNode = null;
    let animationFrame = null;
    let visualizedAudio = null;
    const frequencyData = new Uint8Array(64);

    function formatTime(seconds) {
        if (!Number.isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    function drawIdleVisualizer(canvas) {
        const ctx = canvas && canvas.getContext('2d');
        if (!ctx) return;
        const width = canvas.width;
        const height = canvas.height;
        const bars = 28;
        const gap = 4;
        const barWidth = (width - gap * (bars - 1)) / bars;

        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < bars; i++) {
            const wave = Math.sin((i / bars) * Math.PI * 2);
            const barHeight = 6 + Math.abs(wave) * 18;
            const x = i * (barWidth + gap);
            const y = (height - barHeight) / 2;
            ctx.fillStyle = `rgba(240, 192, 64, ${0.18 + Math.abs(wave) * 0.18})`;
            ctx.fillRect(x, y, barWidth, barHeight);
        }
    }

    function stopVisualizer() {
        if (!animationFrame) return;
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }

    function disconnectVisualizerNodes() {
        if (sourceNode) {
            try {
                sourceNode.disconnect();
            } catch (err) {
                // Already disconnected.
            }
        }

        if (analyser) {
            try {
                analyser.disconnect();
            } catch (err) {
                // Already disconnected.
            }
        }

        sourceNode = null;
        analyser = null;
        visualizedAudio = null;
    }

    function startVisualizer(wrapper, audio) {
        const canvas = wrapper.querySelector('.visualizer');
        const ctx = canvas && canvas.getContext('2d');
        if (!ctx) return;

        if (visualizedAudio !== audio) {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                audioContext = audioContext || new AudioCtx();
                disconnectVisualizerNodes();
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 128;
                analyser.smoothingTimeConstant = 0.78;
                sourceNode = audio._sourceNode || audioContext.createMediaElementSource(audio);
                audio._sourceNode = sourceNode;
                sourceNode.connect(analyser);
                analyser.connect(audioContext.destination);
                visualizedAudio = audio;
            } catch (err) {
                console.warn('Visualizer unavailable for this audio source:', err);
                drawIdleVisualizer(canvas);
                return;
            }
        }

        if (audioContext.state === 'suspended') audioContext.resume();

        const width = canvas.width;
        const height = canvas.height;

        function render() {
            animationFrame = requestAnimationFrame(render);
            analyser.getByteFrequencyData(frequencyData);
            ctx.clearRect(0, 0, width, height);

            const bars = 32;
            const gap = 3;
            const barWidth = (width - gap * (bars - 1)) / bars;

            for (let i = 0; i < bars; i++) {
                const value = frequencyData[i] / 255;
                const barHeight = Math.max(4, value * height * 0.92);
                const x = i * (barWidth + gap);
                const y = height - barHeight;
                ctx.fillStyle = `rgba(240, 192, 64, ${0.28 + value * 0.72})`;
                ctx.fillRect(x, y, barWidth, barHeight);
            }
        }

        stopVisualizer();
        render();
    }

    function syncPlayerUi(wrapper, audio) {
        const progress = wrapper.querySelector('.player-progress');
        const fill = wrapper.querySelector('.progress-fill');
        const time = wrapper.querySelector('.player-time');
        const percent = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
        fill.style.width = `${percent}%`;
        progress.setAttribute('aria-valuenow', Math.round(percent));
        time.textContent = formatTime(audio.currentTime);
    }

    function setPlayingState(wrapper, isPlaying) {
        const button = wrapper.querySelector('.player-button');
        const card = wrapper.closest('.beat-card');
        wrapper.classList.toggle('is-playing', isPlaying);
        if (card) card.classList.toggle('is-playing', isPlaying);
        button.setAttribute('aria-label', `${isPlaying ? 'Pause' : 'Play'} ${wrapper.dataset.title}`);
    }

    function unloadPlayer(wrapper) {
        const audio = activePlayers.get(wrapper);
        if (!audio) return;

        if (visualizedAudio === audio) {
            stopVisualizer();
            disconnectVisualizerNodes();
        }

        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        activePlayers.delete(wrapper);
        setPlayingState(wrapper, false);
        drawIdleVisualizer(wrapper.querySelector('.visualizer'));
    }

    function loadPlayer(wrapper) {
        if (activePlayers.has(wrapper)) {
            return activePlayers.get(wrapper);
        }

        const src = wrapper.getAttribute('data-src');
        if (!src) return null;

        const audio = new Audio();
        audio.preload = 'metadata';
        audio.crossOrigin = 'anonymous';
        audio.src = src;

        audio.addEventListener('timeupdate', () => syncPlayerUi(wrapper, audio));
        audio.addEventListener('loadedmetadata', () => syncPlayerUi(wrapper, audio));
        audio.addEventListener('pause', () => {
            setPlayingState(wrapper, false);
            if (currentWrapper === wrapper) {
                stopVisualizer();
                drawIdleVisualizer(wrapper.querySelector('.visualizer'));
            }
        });
        audio.addEventListener('play', () => {
            setPlayingState(wrapper, true);
            startVisualizer(wrapper, audio);
        });
        audio.addEventListener('ended', () => {
            audio.currentTime = 0;
            syncPlayerUi(wrapper, audio);
            setPlayingState(wrapper, false);
        });
        audio.addEventListener('error', () => {
            unloadPlayer(wrapper);
            wrapper.classList.add('has-error');
            wrapper.querySelector('.player-time').textContent = 'Error';
        }, { once: true });

        activePlayers.set(wrapper, audio);
        return audio;
    }

    function pauseOtherPlayers(wrapper) {
        activePlayers.forEach((audio, activeWrapper) => {
            if (activeWrapper !== wrapper) {
                audio.pause();
                setPlayingState(activeWrapper, false);
                drawIdleVisualizer(activeWrapper.querySelector('.visualizer'));
            }
        });
    }

    async function togglePlayback(wrapper) {
        wrapper.classList.remove('has-error');
        const audio = loadPlayer(wrapper);
        if (!audio) return;

        if (!audio.paused) {
            audio.pause();
            return;
        }

        pauseOtherPlayers(wrapper);
        currentWrapper = wrapper;

        try {
            await audio.play();
        } catch (err) {
            console.error('Failed to play preview:', err);
            setPlayingState(wrapper, false);
        }
    }

    function seek(wrapper, clientX) {
        const audio = activePlayers.get(wrapper);
        if (!audio || !audio.duration) return;
        const progress = wrapper.querySelector('.player-progress');
        const rect = progress.getBoundingClientRect();
        const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
        audio.currentTime = audio.duration * ratio;
        syncPlayerUi(wrapper, audio);
    }

    wrappers.forEach(wrapper => {
        drawIdleVisualizer(wrapper.querySelector('.visualizer'));

        const button = wrapper.querySelector('.player-button');
        const progress = wrapper.querySelector('.player-progress');

        button.addEventListener('click', () => togglePlayback(wrapper));
        progress.addEventListener('click', event => seek(wrapper, event.clientX));
        progress.addEventListener('keydown', event => {
            const audio = activePlayers.get(wrapper);
            if (!audio || !audio.duration) return;
            const step = event.shiftKey ? 10 : 5;
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                audio.currentTime = Math.min(audio.currentTime + step, audio.duration);
            }
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                audio.currentTime = Math.max(audio.currentTime - step, 0);
            }
            syncPlayerUi(wrapper, audio);
        });
    });

    window.addEventListener('pagehide', () => {
        stopVisualizer();
        activePlayers.forEach((_, wrapper) => unloadPlayer(wrapper));
    }, { once: true });
}

document.addEventListener('DOMContentLoaded', loadBeats);
window.addEventListener('hashchange', scrollToBeatFromHash);
