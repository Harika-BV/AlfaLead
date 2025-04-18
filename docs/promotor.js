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
});

searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const leads = document.querySelectorAll("#leadsList li");
  leads.forEach((lead) => {
    lead.style.display = lead.textContent.toLowerCase().includes(query)
      ? "block"
      : "none";
  });
});

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
