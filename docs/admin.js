const API_BASE = "https://web-production-df1bf.up.railway.app";
const token = sessionStorage.getItem("token");
const DB_NAME = "offline-admin";
const STORE_NAME = "pendingActions";

// Redirect to login if not authenticated
if (!token) window.location.href = "index.html";

// =================== IndexedDB Setup ===================
let db;
const request = indexedDB.open(DB_NAME, 1);
request.onerror = () => console.error("IndexedDB failed");
request.onsuccess = () => {
    db = request.result;
    syncPendingActions();
};
request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
    }
};

function saveOfflineAction(action) {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add(action);
}

function getAllOfflineActions() {
    return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
    });
}

function clearOfflineActions() {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
}

// =================== Sync Logic ===================
async function syncPendingActions() {
    const actions = await getAllOfflineActions();
    for (let action of actions) {
        try {
            await fetch(`${API_BASE}${action.endpoint}`, {
                method: action.method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(action.payload),
            });
        } catch (err) {
            console.warn("Sync failed:", err);
            return; // Stop on first failure to try again later
        }
    }
    clearOfflineActions();
    fetchUsers();
    fetchLeads();
}

window.addEventListener("online", syncPendingActions);

// =================== User Creation ===================
document.getElementById("addUserForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const phone = document.getElementById("userPhone").value;
    const role = document.getElementById("userRole").value;

    const payload = { phone, role };
    const endpoint = "/users/create";
    const method = "POST";

    if (navigator.onLine) {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) {
                alert("User added!");
                document.getElementById("addUserForm").reset();
                fetchUsers();
            } else {
                alert(data.detail || "Failed to add user");
            }
        } catch {
            alert("Network error. Saved offline.");
            saveOfflineAction({ method, endpoint, payload });
        }
    } else {
        alert("Offline. User will be added when online.");
        saveOfflineAction({ method, endpoint, payload });
    }
});

// =================== User Fetch ===================
async function fetchUsers() {
    const res = await fetch(`${API_BASE}/users/all`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const users = await res.json();
    const tbody = document.getElementById("userTableBody");
    tbody.innerHTML = "";
    users.forEach(user => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${user.phone}</td><td>${user.role}</td>`;
        tbody.appendChild(row);
    });
}

// =================== Leads Fetch & Edit ===================
async function fetchLeads() {
    const res = await fetch(`${API_BASE}/leads/all`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const leads = await res.json();
    const tbody = document.getElementById("leadsTableBody");
    tbody.innerHTML = "";
    leads.forEach(lead => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><input value="${lead.name}" onchange="updateLead(${lead.id}, 'name', this.value)"></td>
            <td><input value="${lead.phone}" onchange="updateLead(${lead.id}, 'phone', this.value)"></td>
            <td><input value="${lead.place}" onchange="updateLead(${lead.id}, 'place', this.value)"></td>
            <td>${lead.created_by}</td>
            <td><button onclick="archiveLead(${lead.id})">Archive</button></td>
        `;
        tbody.appendChild(row);
    });
}

// =================== Lead Update ===================
async function updateLead(id, field, value) {
    const payload = { [field]: value };
    const endpoint = `/leads/${id}`;
    const method = "PATCH";

    if (navigator.onLine) {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error();
        } catch {
            alert("Failed to sync. Saved offline.");
            saveOfflineAction({ method, endpoint, payload });
        }
    } else {
        alert("Offline. Change saved and will sync.");
        saveOfflineAction({ method, endpoint, payload });
    }
}

// =================== Archive Lead ===================
async function archiveLead(id) {
    if (!confirm("Are you sure you want to archive this lead?")) return;

    const payload = { archived: true };
    const endpoint = `/leads/${id}`;
    const method = "PATCH";

    if (navigator.onLine) {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error();
            alert("Lead archived.");
            fetchLeads();
        } catch {
            alert("Failed to archive online. Saved offline.");
            saveOfflineAction({ method, endpoint, payload });
        }
    } else {
        alert("Offline. Archive request saved.");
        saveOfflineAction({ method, endpoint, payload });
    }
}

// =================== Tab Logic ===================
function showTab(tabId) {
    document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(div => div.classList.remove("active"));
    document.querySelector(`button[onclick="showTab('${tabId}')"]`).classList.add("active");
    document.getElementById(tabId).classList.add("active");

    if (tabId === "userList") fetchUsers();
    if (tabId === "manageLeads") fetchLeads();
}

// =================== Lead Search ===================
function searchLeads() {
    const input = document.getElementById("searchLeads").value.toLowerCase();
    const rows = document.querySelectorAll("#leadsTableBody tr");
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(input) ? "" : "none";
    });
}

// Initial load
fetchUsers();
