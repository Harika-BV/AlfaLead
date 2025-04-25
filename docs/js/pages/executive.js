import { fetchLeads, createLead, offlineCreateLead } from '../api.js';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// right at the top of admin.js
const userRole = localStorage.getItem('role');
if (userRole !== 'executive') {
  alert('You’re not authorized to view this page.');
  window.location.replace('');
  // stop any further JS
  throw new Error('Unauthorized');
}

// Elements
const offlineBanner      = document.getElementById('offlineBanner');
const logoutBtn          = document.getElementById('logoutBtn');
const userPhoneEl        = document.getElementById('userPhone');
const scanCard           = document.getElementById('scanCard');
const scanModal          = document.getElementById('scanModal');
const videoPreview       = document.getElementById('video');
const closeModalBtn      = document.getElementById('closeModalBtn');
const captureBtn         = document.getElementById('captureBtn');
const manualEntryBtn     = document.getElementById('manualEntryBtn');
const manualEntryPanel   = document.getElementById('manualEntryPanel');
const execStep1Form      = document.getElementById('execStep1');
const execStep2Form      = document.getElementById('execStep2');
const execNextBtn        = document.getElementById('exec-next-btn');
const execBackBtn        = document.getElementById('exec-back-btn');
const execSaveBtn        = document.getElementById('exec-save-btn');
const execFormError      = document.getElementById('exec-form-error');
const leadsContainer     = document.getElementById('leadsContainer');
const recentBtn          = document.getElementById('recentBtn');
const allBtn             = document.getElementById('allBtn');

// Helper: attach speech-to-text to any input or textarea
function attachSpeech(inputId, btnId) {
  const recog = new SpeechRecognition();
  recog.lang = 'en-US';
  recog.interimResults = false;

  const input  = document.getElementById(inputId);
  const micBtn = document.getElementById(btnId);

  micBtn.onclick = () => recog.start();
  recog.onstart   = () => micBtn.classList.add('listening');
  recog.onend     = () => micBtn.classList.remove('listening');
  recog.onerror   = () => micBtn.classList.remove('listening');
  recog.onresult  = e => {
    input.value += e.results[0][0].transcript;
  };
}

// Show the logged-in phone
userPhoneEl.textContent = localStorage.getItem('phone') || 'User';

// Logout
logoutBtn.onclick = () => {
  localStorage.clear();
  window.location.href = 'index.html';
};

// Offline banner toggle
function updateOnline() {
  offlineBanner.classList.toggle('hidden_popup', navigator.onLine);
}
window.addEventListener('online', updateOnline);
window.addEventListener('offline', updateOnline);
updateOnline();

// Scan modal handlers
scanCard.onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoPreview.srcObject = stream;
    scanModal.classList.remove('hidden_popup');
  } catch {
    alert('Camera access denied');
  }
};
closeModalBtn.onclick = () => {
  videoPreview.srcObject.getTracks().forEach(t => t.stop());
  scanModal.classList.add('hidden_popup');
};
captureBtn.onclick = () => {
  // TODO: send frame for OCR, then fill exec-name/exec-phone/exec-place
  closeModalBtn.click();
};

// Speech‐to‐text wiring for step1 & step2 fields
attachSpeech('exec-name',  'voiceName');
attachSpeech('exec-phone', 'voicePhone');
attachSpeech('exec-place', 'voicePlace');
attachSpeech('exec-notes', 'voiceNotes');

// Manual-entry panel toggle
manualEntryBtn.onclick = () => {
  const open = manualEntryPanel.classList.toggle('open');
  manualEntryBtn.textContent = open ? 'Cancel' : 'New Lead';
  // Reset to step 1
  execStep2Form.classList.add('hidden_popup');
  execStep1Form.classList.remove('hidden_popup');
  execFormError.textContent = '';
};

// Multi-step flow data
let execLeadData = {};

// Step1 → Step2
execNextBtn.onclick = e => {
  e.preventDefault();
  execFormError.textContent = '';
  const name  = document.getElementById('exec-name').value.trim();
  const phone = document.getElementById('exec-phone').value.trim();
  const place = document.getElementById('exec-place').value.trim();
  if (!name || !phone || !place) {
    execFormError.textContent = 'All fields are required';
    return;
  }
  execLeadData = { name, phone, place };
  execStep1Form.classList.add('hidden_popup');
  execStep2Form.classList.remove('hidden_popup');
};

// Step2 Back
execBackBtn.onclick = e => {
  e.preventDefault();
  execFormError.textContent = '';
  execStep2Form.classList.add('hidden_popup');
  execStep1Form.classList.remove('hidden_popup');
};

// Step2 Save
execSaveBtn.onclick = async (e) => {
  e.preventDefault();
  execFormError.textContent = '';
  const ttp = document.getElementById('exec-ttp').value;
  if (!ttp) {
    execFormError.textContent = 'Please select a time to purchase';
    return;
  }
  try {
    // Use offlineCreateLead so it queues when offline
    await offlineCreateLead({ ...execLeadData, timeToPurchase: ttp });
    manualEntryPanel.classList.remove('open');
    manualEntryBtn.textContent = 'New Lead';
    renderLeads(currentViewRecent); // refresh list in current view
  } catch {
    execFormError.textContent = 'Failed to create lead';
  }
};

// Keep track of current Recent/All view
let currentViewRecent = true;

/** 
 * Renders the leads as cards with optional search 
 * @param {boolean} recent 
 */
async function renderLeads(recent = true) {
  currentViewRecent = recent;

  // Toggle button states
  recentBtn.classList.toggle('active', recent);
  allBtn.classList.toggle('active', !recent);

  // Clear
  leadsContainer.innerHTML = '';

  // If All: inject search
  let allLeads = [];
  if (!recent) {
    const searchDiv = document.createElement('div');
    searchDiv.className = 'search-filter';
    searchDiv.innerHTML = `
      <input id="searchInput" class="search-input" placeholder="Search leads…" />
    `;
    leadsContainer.appendChild(searchDiv);
  }

  // Fetch leads (Exec sees all)
  try {
    allLeads = await fetchLeads('executive');
    console.log(allLeads);
  } catch (err) {
    console.error('Error fetching leads:', err);
  }

  // Decide slice
  const toShow = recent ? allLeads.slice(0, 3) : allLeads;
  renderLeadCards(toShow);

  // Wire search in All
  if (!recent) {
    document.getElementById('searchInput').addEventListener('input', e => {
      const q = e.target.value.trim().toLowerCase();
      const filtered = allLeads.filter(
        l => l.name.toLowerCase().includes(q) || l.place.toLowerCase().includes(q)
      );
      renderLeadCards(filtered);
    });
  }
}

/**
 * Helper to render lead cards in the container
 * @param {Array} leads 
 */
function renderLeadCards(leads) {
  // Remove existing list
  const existing = leadsContainer.querySelector('.leads-list');
  if (existing) existing.remove();

  const listEl = document.createElement('div');
  listEl.className = 'leads-list';

  leads.forEach(l => {
    const card = document.createElement('div');
    card.className = 'lead-card';
    card.innerHTML = `
      <div class="name">${l.name}</div>
      <div class="meta">
        ${l.place}<br/>
        <span class="date">Added: ${new Date(l.created_at).toLocaleDateString()}</span>
      </div>
    `;
    listEl.appendChild(card);
  });

  leadsContainer.appendChild(listEl);
}

// Toggle handlers & initial load
recentBtn.onclick = () => renderLeads(true);
allBtn.onclick    = () => renderLeads(false);
renderLeads(true);
