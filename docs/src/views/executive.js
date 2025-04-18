// src/views/executive.js
import { fetchLeads, createLead, updateLead } from '../api.js';

export async function renderExecutive() {
  console.log('🚀 renderExecutive called');
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="flex flex-col h-screen">

      <!-- Header -->
      <header class="flex items-center justify-between p-4 bg-white shadow">
        <h1 class="text-xl font-semibold">Hi, Executive!</h1>
        <button id="logoutBtn" class="text-gray-600 hover:text-gray-800">🔒</button>
      </header>

      <!-- Content -->
      <main id="mainContent" class="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4"></main>
    </div>
  `;

  // Logout
  document.getElementById('logoutBtn').onclick = () => {
    localStorage.clear();
    window.location.hash = '#/login';
  };

  // Scan modal helpers (same modal as promoter)
  async function openScanModal() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.getElementById('video');
      video.srcObject = stream;
      document.getElementById('scanModal').classList.remove('hidden');
    } catch {
      alert('Camera access denied');
    }
  }
  function closeScanModal() {
    const video = document.getElementById('video');
    if (video?.srcObject) {
      video.srcObject.getTracks().forEach(t => t.stop());
    }
    document.getElementById('scanModal').classList.add('hidden');
  }
  document.getElementById('closeModalBtn').onclick = closeScanModal;
  document.getElementById('captureBtn').onclick = () => {
    alert('Capture not implemented');
  };

  // Multi‑step form for new lead
  function showForm() {
    const main = document.getElementById('mainContent');
    main.innerHTML = `
      <form id="leadStep1" class="space-y-4 bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold">New Lead – Step 1</h3>
        <input id="leadName"   class="w-full px-3 py-2 border rounded" placeholder="Name"/>
        <input id="leadPhone"  class="w-full px-3 py-2 border rounded" placeholder="Phone"/>
        <input id="leadPlace"  class="w-full px-3 py-2 border rounded" placeholder="Place"/>
        <div class="flex justify-end">
          <button type="button" id="nextBtn" class="px-4 py-2 bg-indigo-600 text-white rounded-lg">
            Next
          </button>
        </div>
      </form>
      <p id="formError" class="text-red-500 text-sm"></p>
    `;

    document.getElementById('nextBtn').onclick = () => {
      const name  = document.getElementById('leadName').value;
      const phone = document.getElementById('leadPhone').value;
      const place = document.getElementById('leadPlace').value;
      if (!name || !phone || !place) {
        return (document.getElementById('formError').textContent = 'All fields required');
      }
      showStep2({ name, phone, place });
    };
  }

  function showStep2(data1) {
    const main = document.getElementById('mainContent');
    main.innerHTML = `
      <form id="leadStep2" class="space-y-4 bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold">New Lead – Step 2</h3>
        <select id="timeToPurchase" class="w-full px-3 py-2 border rounded">
          <option value="">Time to Purchase</option>
          <option>Immediate</option>
          <option>1–2 months</option>
          <option>3–3.5 months</option>
        </select>
        <input id="priceQuoted" type="number" class="w-full px-3 py-2 border rounded" placeholder="Price Quoted"/>
        <div class="flex space-x-2">
          <button type="button" id="backBtn" class="flex-1 py-2 bg-gray-300 text-gray-800 rounded">
            Back
          </button>
          <button type="submit" id="saveBtn" class="flex-1 py-2 bg-green-600 text-white rounded">
            Save
          </button>
        </div>
      </form>
      <p id="formError2" class="text-red-500 text-sm"></p>
    `;

    document.getElementById('backBtn').onclick = showForm;

    document.getElementById('leadStep2').onsubmit = async (e) => {
      e.preventDefault();
      const timeToPurchase = document.getElementById('timeToPurchase').value;
      const priceQuoted    = parseFloat(document.getElementById('priceQuoted').value);
      if (!timeToPurchase || isNaN(priceQuoted)) {
        return (document.getElementById('formError2').textContent = 'All fields required');
      }
      try {
        await createLead({ ...data1, timeToPurchase, priceQuoted });
        showLeads(true);
      } catch (err) {
        document.getElementById('formError2').textContent = err.message || 'Save failed';
      }
    };
  }

  // Leads list with toggle
  async function showLeads(recent = true) {
    const main = document.getElementById('mainContent');
    main.innerHTML = `
      <div id="scanCard" class="bg-purple-200 bg-opacity-50 rounded-lg p-6 text-purple-800
             flex items-center justify-center cursor-pointer hover:bg-opacity-75 transition">
        📇 Scan Business Card
      </div>
      <button id="manualBtn" class="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
        Manual Entry
      </button>
      <div class="flex justify-center space-x-2">
        <button id="toggleRecent" class="px-4 py-2 ${recent?'bg-indigo-600 text-white':'bg-white text-indigo-600 border'} rounded-lg">Recent</button>
        <button id="toggleAll"    class="px-4 py-2 ${!recent?'bg-indigo-600 text-white':'bg-white text-indigo-600 border'} rounded-lg">All</button>
      </div>
      <ul id="leadsList" class="space-y-2"></ul>
    `;

    document.getElementById('scanCard').onclick    = openScanModal;
    document.getElementById('manualBtn').onclick   = showForm;
    document.getElementById('toggleRecent').onclick = () => showLeads(true);
    document.getElementById('toggleAll').onclick    = () => showLeads(false);

    let leads = [];
    try {
      leads = await fetchLeads('executive');
    } catch (e) {
      console.error(e);
    }
    const toShow = recent ? leads.slice(0,5) : leads;
    const listEl = document.getElementById('leadsList');
    listEl.innerHTML = '';
    toShow.forEach(l => {
      const li = document.createElement('li');
      li.className = 'p-4 bg-white rounded-lg shadow flex justify-between';
      li.innerHTML = `<span>${l.name}</span><span>${l.place}</span>`;
      listEl.appendChild(li);
    });
  }

  // Offline banner
  const offlineBanner = document.getElementById('offlineBanner');
  if (offlineBanner) {
    const upd = () => offlineBanner.classList.toggle('hidden', navigator.onLine);
    window.addEventListener('online', upd);
    window.addEventListener('offline', upd);
    upd();
  }

  // Start with recent
  showLeads(true);
}
