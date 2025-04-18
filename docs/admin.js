const API_BASE = "https://web-production-df1bf.up.railway.app";
const token = sessionStorage.getItem("token");

// Redirect to login if not authenticated
if (!token) {
    window.location.href = "index.html";
}

document.getElementById("addUserForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const phone = document.getElementById("userPhone").value;
    const role = document.getElementById("userRole").value;

    const response = await fetch(`${API_BASE}/users/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phone, role })
    });

    const data = await response.json();
    if (response.ok) {
        alert("User added!");
        document.getElementById("addUserForm").reset();
        fetchUsers();
    } else {
        alert(data.detail || "Failed to add user");
    }
});

// Fetch and display user list
async function fetchUsers() {
    const response = await fetch(`${API_BASE}/users/all`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    const users = await response.json();
    const tbody = document.getElementById("userTableBody");
    tbody.innerHTML = "";
    users.forEach(user => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${user.phone}</td><td>${user.role}</td>`;
        tbody.appendChild(row);
    });
}

// Fetch and display all leads
async function fetchLeads() {
    const response = await fetch(`${API_BASE}/leads/all`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const leads = await response.json();
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

// Edit lead field
async function updateLead(id, field, value) {
    const payload = { [field]: value };
    const response = await fetch(`${API_BASE}/leads/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        alert("Failed to update lead");
    }
}

// Archive lead (soft delete - here just alert for now)
async function archiveLead(id) {
    if (!confirm("Are you sure you want to archive this lead?")) return;
    // Implement actual archive endpoint if needed
    alert("Lead archived (placeholder)");
}

// Tab switching
function showTab(tabId) {
    document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(div => div.classList.remove("active"));

    document.querySelector(`button[onclick="showTab('${tabId}')"]`).classList.add("active");
    document.getElementById(tabId).classList.add("active");

    if (tabId === "userList") fetchUsers();
    if (tabId === "manageLeads") fetchLeads();
}

// Search leads
function searchLeads() {
    const input = document.getElementById("searchLeads").value.toLowerCase();
    const rows = document.querySelectorAll("#leadsTableBody tr");
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(input) ? "" : "none";
    });
}

// Auto-load users when dashboard opens
fetchUsers();
