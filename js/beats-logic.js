const CONFIG = {
    FOLDER_ID: '1LCxTPh6hYsNyXZ5dvnokackviwAKHvLi',
    API_KEY: 'AIzaSyCpy-rEO1nopWSSWFuvrWDpelidsV2gpl4',
    PAYPAL_EMAIL: 'cyrozv@gmail.com',
    DEFAULT_PRICE: 30,
    CURRENCY: 'USD',
};

const PAYPAL_ICON = `<svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/></svg>`;
const LINK_ICON = `<svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.43"/><path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.33-1.33"/></svg>`;
const OSCILLOSCOPE_FPS = 60;
const OSCILLOSCOPE_FRAME_MS = 1000 / OSCILLOSCOPE_FPS;
const OSCILLOSCOPE_CENTER = 128;
const OSCILLOSCOPE_VISIBLE_SECONDS = 0.045;
const OSCILLOSCOPE_HISTORY_SECONDS = 0.18;
const OSCILLOSCOPE_SEEK_RESET_SECONDS = 0.12;

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
    let waveformData = new Uint8Array(2048);
    let oscilloscopeState = null;

    function formatTime(seconds) {
        if (!Number.isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    function prepareVisualizerCanvas(canvas) {
        const ctx = canvas && canvas.getContext('2d');
        if (!ctx) return null;

        const ratio = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
        const width = Math.max(1, Math.round(canvas.clientWidth || canvas.width));
        const height = Math.max(1, Math.round(canvas.clientHeight || canvas.height));
        const scaledWidth = Math.round(width * ratio);
        const scaledHeight = Math.round(height * ratio);

        if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
            canvas.width = scaledWidth;
            canvas.height = scaledHeight;
        }

        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        return { ctx, width, height };
    }

    function drawOscilloscopeGrid(ctx, width, height) {
        const centerY = height / 2;
        ctx.clearRect(0, 0, width, height);

        ctx.fillStyle = 'rgba(2, 2, 2, 0.2)';
        ctx.fillRect(0, 0, width, height);

        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(240, 192, 64, 0.08)';
        ctx.beginPath();
        for (let x = 0; x <= width; x += width / 8) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let y = height / 4; y <= height; y += height / 4) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();

        ctx.strokeStyle = 'rgba(240, 192, 64, 0.2)';
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();
    }

    function createOscilloscopeState(sampleRate, audioTime = 0) {
        const sampleCount = Math.max(2, Math.ceil(sampleRate * OSCILLOSCOPE_HISTORY_SECONDS));
        return {
            sampleRate,
            history: new Float32Array(sampleCount),
            writeIndex: 0,
            samplesWritten: 0,
            lastAudioTime: audioTime,
            fractionalSamples: 0,
        };
    }

    function resetOscilloscopeState(sampleRate, audioTime = 0) {
        oscilloscopeState = createOscilloscopeState(sampleRate, audioTime);
        return oscilloscopeState;
    }

    function appendOscilloscopeSamples(state, data, sampleCount) {
        if (!state || !data || sampleCount <= 0) return;
        const writableSamples = Math.min(sampleCount, data.length, state.history.length);
        const readStart = data.length - writableSamples;

        for (let i = 0; i < writableSamples; i++) {
            state.history[state.writeIndex] = data[readStart + i] / OSCILLOSCOPE_CENTER - 1;
            state.writeIndex = (state.writeIndex + 1) % state.history.length;
        }

        state.samplesWritten = Math.min(state.history.length, state.samplesWritten + writableSamples);
    }

    function updateOscilloscopeHistory(state, data, audioTime) {
        if (!state || !data || !Number.isFinite(audioTime)) return;

        const elapsedSeconds = audioTime - state.lastAudioTime;
        if (!state.samplesWritten || elapsedSeconds < 0 || elapsedSeconds > OSCILLOSCOPE_SEEK_RESET_SECONDS) {
            state.writeIndex = 0;
            state.samplesWritten = 0;
            state.fractionalSamples = 0;
            appendOscilloscopeSamples(
                state,
                data,
                Math.min(data.length, Math.ceil(state.sampleRate * OSCILLOSCOPE_VISIBLE_SECONDS))
            );
            state.lastAudioTime = audioTime;
            return;
        }

        const elapsedSamples = elapsedSeconds * state.sampleRate + state.fractionalSamples;
        const samplesToAppend = Math.floor(elapsedSamples);
        state.fractionalSamples = elapsedSamples - samplesToAppend;
        appendOscilloscopeSamples(state, data, samplesToAppend);
        state.lastAudioTime = audioTime;
    }

    function readOscilloscopeSample(state, distanceFromNewest) {
        if (!state || state.samplesWritten < 1) return 0;

        const maxDistance = state.samplesWritten - 1;
        const clampedDistance = Math.min(Math.max(distanceFromNewest, 0), maxDistance);
        const nearDistance = Math.floor(clampedDistance);
        const farDistance = Math.min(maxDistance, nearDistance + 1);
        const blend = clampedDistance - nearDistance;
        const nearIndex = (state.writeIndex - 1 - nearDistance + state.history.length) % state.history.length;
        const farIndex = (state.writeIndex - 1 - farDistance + state.history.length) % state.history.length;
        const nearSample = state.history[nearIndex];
        const farSample = state.history[farIndex];

        return nearSample + (farSample - nearSample) * blend;
    }

    function drawOscilloscopeTrace(ctx, width, height, state) {
        const centerY = height / 2;
        const amplitude = height * 0.42;

        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(240, 192, 64, 0.52)';
        ctx.shadowBlur = 7;
        ctx.strokeStyle = 'rgba(255, 219, 92, 0.92)';
        ctx.beginPath();

        if (!state || state.samplesWritten < 2) {
            const points = 80;
            for (let i = 0; i < points; i++) {
                const x = (i / (points - 1)) * width;
                const y = centerY + Math.sin(i * 0.42) * height * 0.06;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
        } else {
            const visibleSamples = Math.min(
                state.samplesWritten,
                Math.max(2, Math.round(state.sampleRate * OSCILLOSCOPE_VISIBLE_SECONDS))
            );
            const points = Math.max(2, Math.round(width * 1.25));
            const sampleStep = (visibleSamples - 1) / (points - 1);

            for (let i = 0; i < points; i++) {
                const distanceFromNewest = (points - 1 - i) * sampleStep + state.fractionalSamples;
                const sample = readOscilloscopeSample(state, distanceFromNewest);
                const x = (i / (points - 1)) * width;
                const y = centerY + sample * amplitude;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    function drawOscilloscope(canvas, state = null) {
        const prepared = prepareVisualizerCanvas(canvas);
        if (!prepared) return;
        const { ctx, width, height } = prepared;
        drawOscilloscopeGrid(ctx, width, height);
        drawOscilloscopeTrace(ctx, width, height, state);
    }

    function drawIdleVisualizer(canvas) {
        drawOscilloscope(canvas);
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
        oscilloscopeState = null;
    }

    function startVisualizer(wrapper, audio) {
        const canvas = wrapper.querySelector('.visualizer');
        if (!canvas) return;

        if (visualizedAudio !== audio) {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                audioContext = audioContext || new AudioCtx();
                disconnectVisualizerNodes();
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 2048;
                analyser.smoothingTimeConstant = 0;
                waveformData = new Uint8Array(analyser.fftSize);
                sourceNode = audio._sourceNode || audioContext.createMediaElementSource(audio);
                audio._sourceNode = sourceNode;
                sourceNode.connect(analyser);
                analyser.connect(audioContext.destination);
                visualizedAudio = audio;
                resetOscilloscopeState(audioContext.sampleRate, audio.currentTime);
            } catch (err) {
                console.warn('Visualizer unavailable for this audio source:', err);
                drawIdleVisualizer(canvas);
                return;
            }
        }

        if (audioContext.state === 'suspended') audioContext.resume();
        if (!oscilloscopeState || oscilloscopeState.sampleRate !== audioContext.sampleRate) {
            resetOscilloscopeState(audioContext.sampleRate, audio.currentTime);
        }

        let lastFrameTime = 0;

        function render(now = 0) {
            animationFrame = requestAnimationFrame(render);
            if (now - lastFrameTime < OSCILLOSCOPE_FRAME_MS) return;
            lastFrameTime = now - ((now - lastFrameTime) % OSCILLOSCOPE_FRAME_MS);
            analyser.getByteTimeDomainData(waveformData);
            updateOscilloscopeHistory(oscilloscopeState, waveformData, audio.currentTime);
            drawOscilloscope(canvas, oscilloscopeState);
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
