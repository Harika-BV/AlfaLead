const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

import { fetchLeads, createLead, offlineCreateLead } from '../api.js';

// right at the top of admin.js
const userRole = localStorage.getItem('role');
if (userRole !== 'promotor') {
  alert('You’re not authorized to view this page.');
  window.location.replace('');
  // stop any further JS
  throw new Error('Unauthorized');
}

const offlineBanner = document.getElementById('offlineBanner');
const scanModal     = document.getElementById('scanModal');
const videoPreview  = document.getElementById('video');
const scanCard      = document.getElementById('scanCard');
const recentBtn     = document.getElementById('recentBtn');
const allBtn        = document.getElementById('allBtn');
const leadsList     = document.getElementById('leadsList');
const cancelBtn     = document.getElementById('closeModalBtn');
const formError     = document.getElementById('formError');
const logoutBtn     = document.getElementById('logoutBtn');

const manualEntryBtn   = document.getElementById('manualEntryBtn');
const manualEntryPanel = document.getElementById('manualEntryPanel');
const manualSaveBtn    = document.getElementById('manualSaveBtn');


logoutBtn.onclick = () => {
  localStorage.clear();
  window.location.href = 'index.html';
};

// Offline banner
function updateOnline() {
  offlineBanner.classList.toggle('hidden', navigator.onLine);
}
window.addEventListener('online', updateOnline);
window.addEventListener('offline', updateOnline);
updateOnline();

// Scan modal
scanCard.onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video:true });
    videoPreview.srcObject = stream;
    scanModal.classList.remove('hidden');
  } catch {
    alert('Camera denied');
  }
};
document.getElementById('closeModalBtn').onclick = () => {
  videoPreview.srcObject.getTracks().forEach(t=>t.stop());
  scanModal.classList.add('hidden_popup');
};
document.getElementById('captureBtn').onclick = () => {
  alert('Capture logic TBD');
};
cancelBtn.onclick = () => showLeads(true);

// Show leads list
async function showLeads(recent = true) {
  // 1) Update toggle button states
  recentBtn.classList.toggle('active', recent);
  allBtn.classList.toggle('active', !recent);

  // 2) Close manual-entry panel if open
  manualEntryPanel.classList.remove('open');
  manualEntryBtn.textContent = 'Manual Entry';

  // 3) Clear existing content
  const container = document.getElementById('leadsContainer');
  container.innerHTML = '';

  // 4) If “All”, inject a search input
  if (!recent) {
    const controls = document.createElement('div');
    controls.className = 'search-filter';
    controls.innerHTML = `
      <input
        type="text"
        id="searchInput"
        placeholder="Search leads…"
        class="search-input"
      />
    `;
    container.appendChild(controls);
  }

  // 5) Fetch leads from your API
  let leads = [];
  try {
    leads = await fetchLeads('promotor');
  } catch (err) {
    console.error('Error fetching leads:', err);
  }

  // 6) Choose which to display
  const toShow = recent ? leads.slice(0, 3) : leads;

  // 7) Build the vertical list of cards
  const listEl = document.createElement('div');
  listEl.className = 'leads-list';
  toShow.forEach(l => {
    const card = document.createElement('div');
    card.className = 'lead-card';
    card.innerHTML = `
      <div class="name">Name: ${l.name}</div>
      <div class="meta">
        Place: ${l.place}<br/>
        <span class="date">Added: ${new Date(l.created_at).toLocaleDateString()}</span>
      </div>
    `;
    listEl.appendChild(card);
  });
  container.appendChild(listEl);

  // 8) Wire up search filtering (for “All” view)
  if (!recent) {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      const filtered = leads.filter(
        l =>
          l.name.toLowerCase().includes(q) ||
          l.place.toLowerCase().includes(q)
      );
      // re-render
      listEl.innerHTML = '';
      filtered.forEach(l => {
        const card = document.createElement('div');
        card.className = 'lead-card';
        card.innerHTML = `
          <div class="name">Name: ${l.name}</div>
          <div class="meta">
            Place: ${l.place}<br/>
            <span class="date">Added: ${new Date(
              l.created_at
            ).toLocaleDateString()}</span>
          </div>
        `;
        listEl.appendChild(card);
      });
    });
  }
}

manualEntryBtn.onclick = () => {
  const isOpen = manualEntryPanel.classList.toggle('open');
  manualEntryBtn.textContent = isOpen ? 'Cancel' : 'Manual Entry';

  if (isOpen) {
    // inject the expanded form with Notes + mic buttons
    manualEntryPanel.innerHTML = `
      <h3>New Lead Details</h3>

      <div class="speech-field">
        <input id="manualName"  type="text" placeholder="Name"  />
        <button id="voiceName" class="mic-btn" title="Dictate Name">
          <img src="./image/mic.png" alt="Voice input" class="mic-icon" />
        </button>
      </div>

      <div class="speech-field">
        <input id="manualPhone" type="text" placeholder="Phone" />
        <button id="voicePhone" class="mic-btn" title="Dictate Phone">
          <img src="./image/mic.png" alt="Voice input" class="mic-icon" />
        </button>
      </div>

      <div class="speech-field">
        <input id="manualPlace" type="text" placeholder="Place" />
        <button id="voicePlace" class="mic-btn" title="Dictate Place">
          <img src="./image/mic.png" alt="Voice input" class="mic-icon" />
        </button>
      </div>

      <div class="speech-field">
        <textarea id="manualNotes" placeholder="Notes / Comments"></textarea>
        <button id="voiceNotes" class="mic-btn" title="Dictate Notes">
          <img src="./image/mic.png" alt="Voice input" class="mic-icon" />
        </button>
      </div>

      <button id="manualSaveBtn" class="btn primary full">Save</button>
    `;

    // now wire up speech‐to‐text for each pair
    attachSpeech('manualName',  'voiceName');
    attachSpeech('manualPhone', 'voicePhone');
    attachSpeech('manualPlace', 'voicePlace');
    attachSpeech('manualNotes', 'voiceNotes');

    // re-grab the save button and hook up the save logic as before
    document.getElementById('manualSaveBtn').onclick = async e => {
      e.preventDefault();
      const data = {
        name:  document.getElementById('manualName').value.trim(),
        phone: document.getElementById('manualPhone').value.trim(),
        place: document.getElementById('manualPlace').value.trim(),
      };
      try {
        await offlineCreateLead(data);
        // close panel and reset button text
        manualEntryPanel.classList.remove('open');
        manualEntryBtn.textContent = 'Manual Entry';
        // re-render recent leads
        showLeads(true);
      } catch (err) {
        alert('Failed to save lead');
      }
    };
  }
};


// Save new lead & refresh list
manualSaveBtn.onclick = async (e) => {
  e.preventDefault();
  const data = {
    name:  document.getElementById('manualName').value.trim(),
    phone: document.getElementById('manualPhone').value.trim(),
    place: document.getElementById('manualPlace').value.trim(),
  };
  try {
    await offlineCreateLead(data);
    // close panel and reset button text
    manualEntryPanel.classList.remove('open');
    manualEntryBtn.textContent = 'Manual Entry';
    // re-render recent leads
    showLeads(true);
  } catch (err) {
    alert('Failed to save lead');
  }
};

/**
 * Attaches speech‐to‐text recognition to an input or textarea
 * @param {string} inputId — the field to populate
 * @param {string} btnId   — the mic button that starts recognition
 */
function attachSpeech(inputId, btnId) {
  const rec = new SpeechRecognition();
  rec.lang = 'en-US';
  rec.interimResults = false;

  const field  = document.getElementById(inputId);
  const micBtn = document.getElementById(btnId);

  micBtn.onclick = () => {
    rec.start();
  };

  // when the mic actually starts listening
  rec.onstart = () => {
    micBtn.classList.add('listening');
  };

  // when speech recognition ends
  rec.onend = () => {
    micBtn.classList.remove('listening');
  };

  // append final transcript
  rec.onresult = (e) => {
    field.value += e.results[0][0].transcript;
  };

  // on error, also clear the visual state
  rec.onerror = () => {
    micBtn.classList.remove('listening');
  };
}


recentBtn.onclick = () => showLeads(true);
allBtn.onclick    = () => showLeads(false);
showLeads(true);
