import { fetchLeads, createLead } from '../api.js';

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
  // if opening, clear previous inputs
  if (isOpen) {
    document.getElementById('manualName').value = '';
    document.getElementById('manualPhone').value = '';
    document.getElementById('manualPlace').value = '';
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
    await createLead(data);
    // close panel and reset button text
    manualEntryPanel.classList.remove('open');
    manualEntryBtn.textContent = 'Manual Entry';
    // re-render recent leads
    showLeads(true);
  } catch (err) {
    alert('Failed to save lead');
  }
};

recentBtn.onclick = () => showLeads(true);
allBtn.onclick    = () => showLeads(false);
showLeads(true);
