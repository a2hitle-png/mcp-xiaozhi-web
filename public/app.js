// DOM elements
const wsStatusEl = document.getElementById('wsStatus');
const radioStatusEl = document.getElementById('radioStatus');
const refreshNewsBtn = document.getElementById('refreshNews');
const newsListEl = document.getElementById('newsList');
const searchQueryInput = document.getElementById('searchQuery');
const searchButton = document.getElementById('searchButton');
const radioUrlInput = document.getElementById('radioUrl');
const playRadioBtn = document.getElementById('playRadio');
const stopRadioBtn = document.getElementById('stopRadio');
const radioPlayer = document.getElementById('radioPlayer');
const consoleLogEl = document.getElementById('consoleLog');

// New music DOM elements
const musicQueryInput = document.getElementById('musicQuery');
const playMusicBtn = document.getElementById('playMusic');
const musicPlayerContainer = document.getElementById('musicPlayerContainer');
const musicPlayer = document.getElementById('musicPlayer');
const musicStatusEl = document.getElementById('musicStatus');

let ws;

function logToConsole(message) {
  const timestamp = new Date().toISOString();
  consoleLogEl.value += `[${timestamp}] ${message}\n`;
  consoleLogEl.scrollTop = consoleLogEl.scrollHeight;
}

function updateWsStatus(status) {
  wsStatusEl.textContent = status;
  logToConsole(`WebSocket status: ${status}`);
}

function updateRadioStatus(status) {
  radioStatusEl.textContent = status;
  logToConsole(`Radio status: ${status}`);
}

function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const wsUrl = `${protocol}://${window.location.host}`;

  ws = new WebSocket(wsUrl);

  ws.addEventListener('open', () => {
    updateWsStatus('Connected');
  });

  ws.addEventListener('message', (event) => {
    logToConsole(`Received message: ${event.data}`);
  });

  ws.addEventListener('close', () => {
    updateWsStatus('Disconnected');
    setTimeout(initWebSocket, 3000);
  });

  ws.addEventListener('error', (err) => {
    logToConsole(`WebSocket error: ${err.message || err}`);
  });
}

async function fetchNews() {
  try {
    const res = await fetch('/api/news');
    if (!res.ok) {
      throw new Error(`Failed to fetch news: ${res.status}`);
    }

    const data = await res.json();
    newsListEl.innerHTML = '';
    (data.headlines || []).forEach((headline) => {
      const li = document.createElement('li');
      li.textContent = headline;
      newsListEl.appendChild(li);
    });
  } catch (err) {
    logToConsole(err.message || String(err));
  }
}

async function performSearch() {
  const q = (searchQueryInput.value || '').trim();
  if (!q) {
    logToConsole('Please enter a search query.');
    return;
  }

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) {
      throw new Error(`Search failed: ${res.status}`);
    }

    const data = await res.json();
    if (data.searchUrl) {
      window.open(data.searchUrl, '_blank', 'noopener');
      logToConsole(`Opened Google search for: "${data.query}"`);
    } else {
      logToConsole('No search URL returned from server.');
    }
  } catch (err) {
    logToConsole(err.message || String(err));
  }
}

// New: YouTube music search and open
async function searchAndPlayMusic() {
  const q = (musicQueryInput?.value || '').trim();
  if (!q) {
    logToConsole('Please enter a music search query.');
    return;
  }

  try {
    const res = await fetch(`/api/music/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) {
      throw new Error(`Music search failed: ${res.status}`);
    }

    const data = await res.json();
    if (data.searchUrl) {
      window.open(data.searchUrl, '_blank', 'noopener');
      logToConsole(`Opened YouTube music search for: "${data.query}"`);
    } else {
      logToConsole('No music search URL returned from server.');
    }
  } catch (err) {
    logToConsole(err.message || String(err));
  }
}

function initRadioControls() {
  playRadioBtn.addEventListener('click', () => {
    const url = radioUrlInput.value.trim();
    if (!url) {
      logToConsole('Please enter a radio stream URL.');
      return;
    }

    radioPlayer.src = url;
    radioPlayer.play().then(() => {
      updateRadioStatus('Playing');
    }).catch((err) => {
      logToConsole(`Error playing radio: ${err.message || err}`);
      updateRadioStatus('Error');
    });
  });

  stopRadioBtn.addEventListener('click', () => {
    radioPlayer.pause();
    radioPlayer.currentTime = 0;
    updateRadioStatus('Stopped');
  });
}

function initEventListeners() {
  if (refreshNewsBtn) {
    refreshNewsBtn.addEventListener('click', fetchNews);
  }

  if (searchButton) {
    searchButton.addEventListener('click', performSearch);
  }

  if (searchQueryInput) {
    searchQueryInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        performSearch();
      }
    });
  }

  // Wire up music controls without affecting existing behavior
  if (playMusicBtn && musicQueryInput) {
    playMusicBtn.addEventListener('click', searchAndPlayMusic);

    musicQueryInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        searchAndPlayMusic();
      }
    });
  }
}

function init() {
  initWebSocket();
  initRadioControls();
  initEventListeners();
  fetchNews();
}

window.addEventListener('DOMContentLoaded', init);
