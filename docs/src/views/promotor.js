// src/views/promotor.js
import { fetchLeads, createLead } from '../api.js';

export async function renderPromotor() {
  console.log('🚀 renderpromotor called');

  // 1) Render header + main container
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="flex flex-col h-screen">

      <!-- Header -->
      <header class="flex items-center justify-between p-4 bg-white shadow">
        <h1 class="text-xl font-semibold">Hi, promotor!</h1>
        <button id="logoutBtn" class="text-gray-600 hover:text-gray-800">🔒</button>
      </header>

      <!-- Main content area -->
      <main id="mainContent" class="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4"></main>
    </div>
  `;

  // 2) Logout handler
  document.getElementById('logoutBtn').onclick = () => {
    localStorage.clear();
    window.location.hash = '#/login';
  };

  // 3) Helper to open/close scan modal
  async function openScanModal() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.getElementById('video');
      video.srcObject = stream;
      document.getElementById('scanModal').classList.remove('hidden');
    } catch (err) {
      alert('Camera access denied');
    }
  }
  function closeScanModal() {
    const video = document.getElementById('video');
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach((t) => t.stop());
    }
    document.getElementById('scanModal').classList.add('hidden');
  }
  document.getElementById('closeModalBtn').onclick = closeScanModal;
  document.getElementById('captureBtn').onclick = () => {
    alert('Capture logic not implemented yet');
  };

  // 4) Show "New Lead" form
  function showForm() {
    const main = document.getElementById('mainContent');
    main.innerHTML = `
      <form id="manualForm" class="space-y-4 bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold">New Lead</h3>
        <input id="leadName"       class="w-full px-3 py-2 border rounded" placeholder="Name"/>
        <input id="leadPhone"      class="w-full px-3 py-2 border rounded" placeholder="Phone"/>
        <input id="leadPlace"      class="w-full px-3 py-2 border rounded" placeholder="Place"/>
        <input id="leadEmail"      class="w-full px-3 py-2 border rounded" placeholder="Email"/>
        <textarea id="leadTranscript"
                  class="w-full px-3 py-2 border rounded"
                  placeholder="Transcript"></textarea>
        <div class="flex space-x-2">
          <button type="submit"
                  class="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Save
          </button>
          <button type="button" id="cancelBtn"
                  class="flex-1 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">
            Cancel
          </button>
        </div>
        <p id="formError" class="text-red-500 text-sm"></p>
      </form>
    `;

    // Cancel → back to recent list
    document.getElementById('cancelBtn').onclick = () => showLeads(true);

    // Save → create lead then back to recent
    document.getElementById('manualForm').onsubmit = async (e) => {
      e.preventDefault();
      const lead = {
        name:       document.getElementById('leadName').value,
        phone:      document.getElementById('leadPhone').value,
        place:      document.getElementById('leadPlace').value,
        email:      document.getElementById('leadEmail').value,
        transcript: document.getElementById('leadTranscript').value,
      };
      try {
        await createLead(lead);
        showLeads(true);
      } catch (err) {
        document.getElementById('formError').textContent =
          err.message || 'Failed to save lead';
      }
    };
  }

  // 5) Show leads list with toggles
  async function showLeads(recent = true) {
    const main = document.getElementById('mainContent');
    main.innerHTML = `
      <div id="scanCard"
           class="bg-purple-200 bg-opacity-50 rounded-lg p-6 text-purple-800
                  flex items-center justify-center cursor-pointer
                  hover:bg-opacity-75 transition">
        <span class="text-lg font-medium">📇 Scan Business Card</span>
      </div>

      <button id="manualBtn"
              class="w-full py-3 bg-indigo-600 text-white rounded-lg
                     hover:bg-indigo-700 transition">
        Manual Entry
      </button>

      <div class="flex justify-center space-x-2">
        <button id="toggleRecent"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg">
          Recent
        </button>
        <button id="toggleAll"
                class="px-4 py-2 bg-white text-indigo-600 rounded-lg border">
          All
        </button>
      </div>

      <ul id="leadsList" class="space-y-4"></ul>
    `;

    // Wire interactions
    document.getElementById('scanCard').onclick   = openScanModal;
    document.getElementById('manualBtn').onclick  = () => showForm();
    document.getElementById('toggleRecent').onclick = () => showLeads(true);
    document.getElementById('toggleAll').onclick    = () => showLeads(false);

    // Fetch & render
    let leads = [];
    try {
      leads = await fetchLeads('promotor');
    } catch (err) {
      console.error('Error fetching leads', err);
    }
    const toShow = recent ? leads.slice(0, 5) : leads;
    const listEl = document.getElementById('leadsList');
    toShow.forEach((lead) => {
      const li = document.createElement('li');
      li.className = 'p-4 bg-white rounded-lg shadow flex justify-between';
      li.innerHTML = `
        <span>${lead.name}</span>
        <span>${lead.place}</span>
      `;
      listEl.appendChild(li);
    });
  }

  // 6) Kick off on load: show recent leads
  showLeads(true);
}
