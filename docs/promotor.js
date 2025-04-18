const API_BASE = "https://web-production-df1bf.up.railway.app";
const token = sessionStorage.getItem("token");

if (!token) {
  window.location.href = "/";
}

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json"
};
const leadForm = document.getElementById("leadForm");
const leadsList = document.getElementById("leadsList");
const leadMessage = document.getElementById("leadMessage");
const searchInput = document.getElementById("search");

leadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const place = document.getElementById("place").value.trim();

  // If online, submit lead to the server, else store offline
  if (navigator.onLine) {
    try {
      const res = await fetch(`${API_BASE}/leads/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone, place }),
      });

      const data = await res.json();
      if (res.ok) {
        leadMessage.textContent = "Lead created successfully!";
        leadForm.reset();
        loadLeads(); // refresh list
      } else {
        leadMessage.textContent = data.detail || "Failed to create lead.";
      }
    } catch (err) {
      // Save lead offline if error or network issue
      saveLeadOffline({ name, phone, place });
      leadMessage.textContent = "Lead saved offline. Will sync when online.";
    }
  } else {
    saveLeadOffline({ name, phone, place });
    leadMessage.textContent = "Lead saved offline. Will sync when online.";
  }
});

// Function to save leads locally when offline
function saveLeadOffline(lead) {
  const offlineLeads = getOfflineLeads();
  offlineLeads.push(lead);
  localStorage.setItem("offlineLeads", JSON.stringify(offlineLeads));
}

// Function to get offline leads from localStorage
function getOfflineLeads() {
  return JSON.parse(localStorage.getItem("offlineLeads") || "[]");
}

// Sync offline leads when the app comes online
async function syncOfflineLeads() {
  const offlineLeads = getOfflineLeads();
  if (offlineLeads.length === 0) return;

  for (const lead of offlineLeads) {
    try {
      await fetch(`${API_BASE}/leads/create`, {
        method: "POST",
        headers,
        body: JSON.stringify(lead),
      });

      // Remove successfully synced lead from localStorage
      removeOfflineLead(lead);
    } catch (err) {
      console.error("Error syncing lead:", lead);
      break; // Stop syncing if an error occurs
    }
  }
}

// Remove a lead from offline storage after syncing
function removeOfflineLead(lead) {
  const offlineLeads = getOfflineLeads();
  const updatedLeads = offlineLeads.filter((l) => l.phone !== lead.phone); // Assuming phone is unique
  localStorage.setItem("offlineLeads", JSON.stringify(updatedLeads));
}

// Add event listener to sync leads when online
window.addEventListener("online", syncOfflineLeads);

// Handle search input for filtering leads
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const leads = document.querySelectorAll("#leadsList li");
  leads.forEach((lead) => {
    lead.style.display = lead.textContent.toLowerCase().includes(query) ? "block" : "none";
  });
});

// Load leads from server
async function loadLeads() {
  const res = await fetch(`${API_BASE}/leads/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  leadsList.innerHTML = "";

  data.forEach((lead) => {
    const li = document.createElement("li");
    li.textContent = `${lead.name} (${lead.phone}) - ${lead.place}`;
    leadsList.appendChild(li);
  });
}

// Switch between tabs
function switchTab(tab) {
  const tabs = document.querySelectorAll(".tab-content");
  tabs.forEach((tabContent) => {
    tabContent.style.display = tabContent.id === tab ? "block" : "none";
  });
}

window.onload = () => {
  loadLeads();
  switchTab('add-lead'); // Default to Add Lead Tab
};
