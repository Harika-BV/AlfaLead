import { fetchLeads, createLead } from '../api.js';

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
const recentBtn        = document.getElementById('recentBtn');
const allBtn           = document.getElementById('allBtn');


// Show phone from login
userPhoneEl.textContent = localStorage.getItem('phone') || 'User';

// Logout
logoutBtn.onclick = () => {
  localStorage.clear();
  window.location.href = 'index.html';
};

// Offline banner
function updateOnline() {
  offlineBanner.classList.toggle('hidden_popup', navigator.onLine);
}
window.addEventListener('online', updateOnline);
window.addEventListener('offline', updateOnline);
updateOnline();

// Scan modal
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
  // call your OCR endpoint here, then populate execStep1Form fields:
  // e.g. document.getElementById('exec-name').value = parsedName;
  // For now, close modal:
  closeModalBtn.click();
};

// Manual‐entry panel toggle
manualEntryBtn.onclick = () => {
  const open = manualEntryPanel.classList.toggle('open');
  manualEntryBtn.textContent = open ? 'Cancel' : 'New Lead';
  // reset step & clear errors
  execStep2Form.classList.add('hidden_popup');
  execStep1Form.classList.remove('hidden_popup');
  execFormError.textContent = '';
};

// Step 1 → Step 2
let execLeadData = {};
execNextBtn.onclick = (e) => {
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

// Step 2 Back
execBackBtn.onclick = (e) => {
  e.preventDefault();
  execFormError.textContent = '';
  execStep2Form.classList.add('hidden_popup');
  execStep1Form.classList.remove('hidden_popup');
};

// Step 2 Save
execSaveBtn.onclick = async (e) => {
  e.preventDefault();
  execFormError.textContent = '';
  const ttp = document.getElementById('exec-ttp').value;
  if (!ttp) {
    execFormError.textContent = 'Please select a time to purchase';
    return;
  }
  try {
    await createLead({ ...execLeadData, timeToPurchase: ttp });
    manualEntryPanel.classList.remove('open');
    manualEntryBtn.textContent = 'New Lead';
    renderLeads(); // refresh list
  } catch {
    execFormError.textContent = 'Failed to create lead';
  }
};

async function renderLeads(recent = true) {
  // 1) Toggle buttons
  recentBtn.classList.toggle('active', recent);
  allBtn.classList.toggle('active', !recent);

  // 2) Clear container
  leadsContainer.innerHTML = '';

  // 3) If “All”, add a search field
  let allLeads = [];
  if (!recent) {
    const searchDiv = document.createElement('div');
    searchDiv.className = 'search-filter';
    searchDiv.innerHTML = `
      <input
        id="searchInput"
        class="search-input"
        type="text"
        placeholder="Search leads…"
      />
    `;
    leadsContainer.appendChild(searchDiv);
  }

  // 4) Fetch all leads
  try {
    allLeads = await fetchLeads('executive');
  } catch (err) {
    console.error('Error fetching leads:', err);
  }

  // 5) Decide initial list
  const toShow = recent ? allLeads.slice(0, 3) : allLeads;
  renderLeadCards(toShow);

  // 6) Wire up search only in “All” view
  if (!recent) {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      const filtered = allLeads.filter(
        l => 
          l.name.toLowerCase().includes(q) ||
          l.place.toLowerCase().includes(q)
      );
      renderLeadCards(filtered);
    });
  }
}

/**
 * Helper to (re)render a list of lead cards in the container
 */
function renderLeadCards(leads) {
  // remove any existing cards or tables
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
        <span class="date">
          Added: ${new Date(l.created_at).toLocaleDateString()}
        </span>
      </div>
    `;
    listEl.appendChild(card);
  });

  leadsContainer.appendChild(listEl);
}

// Wire up toggles and initial load
recentBtn.onclick = () => renderLeads(true);
allBtn.onclick    = () => renderLeads(false);

renderLeads(true);
