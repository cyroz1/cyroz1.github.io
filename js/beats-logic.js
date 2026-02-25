const CONFIG = {
    FOLDER_ID: '1LCxTPh6hYsNyXZ5dvnokackviwAKHvLi',
    API_KEY: 'AIzaSyCpy-rEO1nopWSSWFuvrWDpelidsV2gpl4',
    PAYPAL_EMAIL: 'cyrozv@gmail.com',
    DEFAULT_PRICE: 30,
    CURRENCY: 'USD',
};

const PERF_PROFILE = (() => {
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const isNarrowScreen = window.matchMedia('(max-width: 768px)').matches;
    const isMobile = isCoarsePointer || isNarrowScreen;
    return {
        isMobile, isCoarsePointer,
        preloadMarginPx: 0,
        unloadDelayMs: isMobile ? 300 : 900,
        maxActivePlayers: 1,
        clickToLoadPreviews: true,
    };
})();

const PAYPAL_ICON = `<svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/></svg>`;

function beatNameFromFile(filename) {
    return filename.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function paypalUrl(beatName, price) {
    const params = new URLSearchParams({
        cmd: '_xclick', business: CONFIG.PAYPAL_EMAIL,
        item_name: `${beatName} (Beat Lease)`, amount: price,
        currency_code: CONFIG.CURRENCY, no_shipping: '1',
    });
    return `https://www.paypal.com/cgi-bin/webscr?${params}`;
}

function drivePreviewUrl(fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
}

function formatModifiedDate(isoString) {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function createBeatCard(file, index) {
    const name = beatNameFromFile(file.name);
    const price = CONFIG.DEFAULT_PRICE;
    const previewSrc = drivePreviewUrl(file.id);
    const dateStr = formatModifiedDate(file.modifiedTime);

    const card = document.createElement('div');
    card.className = 'beat-card';
    card.style.setProperty('--delay', index);

    card.innerHTML = `
        <div class="beat-header">
            <span class="beat-name">${name}</span>
            <span class="beat-price">$${price}</span>
        </div>
        <div class="beat-meta">
            <span class="beat-tag">Beat Lease</span>
            ${dateStr ? `<span class="beat-date">${dateStr}</span>` : ''}
        </div>
        <div class="beat-player-wrapper" data-src="${previewSrc}">
            ${PERF_PROFILE.clickToLoadPreviews ? `<button class="preview-trigger" type="button">${PERF_PROFILE.isCoarsePointer ? 'Tap' : 'Click'} to load preview</button>` : ''}
        </div>
        <div class="beat-actions">
            <a class="btn-buy" href="${paypalUrl(name, price)}" target="_blank" rel="noopener noreferrer">
                ${PAYPAL_ICON} Buy — $${price}
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
        initLazyLoading();
    } catch (err) {
        console.error('Failed to load beats:', err);
        loading.innerHTML = `<div class="beats-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>Couldn't load beats. Please try again later.</p></div>`;
    }
}

const PLAYER_LAZY_CONFIG = {
    preloadMarginPx: PERF_PROFILE.preloadMarginPx,
    unloadDelayMs: PERF_PROFILE.unloadDelayMs,
    maxActivePlayers: PERF_PROFILE.maxActivePlayers,
};

function initLazyLoading() {
    const wrappers = document.querySelectorAll('.beat-player-wrapper');
    const activePlayers = new Map();
    const pendingUnloads = new Map();
    const visibleWrappers = new Set();
    const lru = [];

    function touchWrapper(w) { const i = lru.indexOf(w); if (i !== -1) lru.splice(i, 1); lru.push(w); }

    function unloadPlayer(wrapper) {
        const iframe = activePlayers.get(wrapper) || wrapper.querySelector('iframe');
        if (!iframe) return;
        iframe.src = 'about:blank';
        iframe.remove();
        activePlayers.delete(wrapper);
        const trigger = wrapper.querySelector('.preview-trigger');
        if (trigger) { trigger.hidden = false; trigger.disabled = false; trigger.textContent = `${PERF_PROFILE.isCoarsePointer ? 'Tap' : 'Click'} to load preview`; }
        const i = lru.indexOf(wrapper); if (i !== -1) lru.splice(i, 1);
    }

    function enforcePlayerLimit(current) {
        while (activePlayers.size > PLAYER_LAZY_CONFIG.maxActivePlayers) {
            const candidate = lru.find(w => w !== current && !visibleWrappers.has(w)) || lru.find(w => w !== current);
            if (!candidate) break;
            unloadPlayer(candidate);
        }
    }

    function cancelUnload(w) { const id = pendingUnloads.get(w); if (!id) return; clearTimeout(id); pendingUnloads.delete(w); }

    function scheduleUnload(wrapper) {
        if (pendingUnloads.has(wrapper)) return;
        const id = setTimeout(() => { pendingUnloads.delete(wrapper); if (!visibleWrappers.has(wrapper)) unloadPlayer(wrapper); }, PLAYER_LAZY_CONFIG.unloadDelayMs);
        pendingUnloads.set(wrapper, id);
    }

    function loadPlayer(wrapper, fromUserGesture = false) {
        cancelUnload(wrapper);
        if (PERF_PROFILE.clickToLoadPreviews && !fromUserGesture) return;
        if (activePlayers.has(wrapper)) { touchWrapper(wrapper); return; }
        if (PERF_PROFILE.clickToLoadPreviews) activePlayers.forEach((_, w) => { if (w !== wrapper) unloadPlayer(w); });
        const src = wrapper.getAttribute('data-src');
        if (!src) return;
        const trigger = wrapper.querySelector('.preview-trigger');
        if (trigger) { trigger.disabled = true; trigger.textContent = 'Loading preview...'; }
        const iframe = document.createElement('iframe');
        iframe.className = 'beat-player';
        iframe.loading = 'lazy';
        iframe.src = src;
        iframe.setAttribute('allow', 'autoplay');
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
        iframe.setAttribute('title', 'Beat preview player');
        iframe.addEventListener('load', () => { if (trigger) trigger.hidden = true; }, { once: true });
        iframe.addEventListener('error', () => { unloadPlayer(wrapper); if (trigger) trigger.textContent = `${PERF_PROFILE.isCoarsePointer ? 'Tap' : 'Click'} to retry preview`; }, { once: true });
        wrapper.appendChild(iframe);
        activePlayers.set(wrapper, iframe);
        touchWrapper(wrapper);
        enforcePlayerLimit(wrapper);
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const w = entry.target;
            if (entry.isIntersecting) { visibleWrappers.add(w); loadPlayer(w); }
            else { visibleWrappers.delete(w); scheduleUnload(w); }
        });
    }, { rootMargin: `${PLAYER_LAZY_CONFIG.preloadMarginPx}px 0px`, threshold: 0.1 });

    wrappers.forEach(w => observer.observe(w));

    if (PERF_PROFILE.clickToLoadPreviews) {
        wrappers.forEach(wrapper => {
            const trigger = wrapper.querySelector('.preview-trigger');
            if (trigger) trigger.addEventListener('click', () => loadPlayer(wrapper, true));
        });
    }

    window.addEventListener('pagehide', () => {
        observer.disconnect();
        pendingUnloads.forEach(id => clearTimeout(id));
        pendingUnloads.clear();
        activePlayers.forEach((_, w) => unloadPlayer(w));
    }, { once: true });
}

document.addEventListener('DOMContentLoaded', loadBeats);
