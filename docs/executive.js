const API_BASE = "https://web-production-df1bf.up.railway.app";  // Backend API base URL
const token = sessionStorage.getItem("token");

// Redirect to login if not authenticated
if (!token) {
    window.location.href = "index.html";
}

// Switch between tabs
function showTab(tab) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(t => t.classList.remove('active'));
    document.getElementById(tab).classList.add('active');
}

// Add lead form submission
document.getElementById('addLeadForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const place = document.getElementById('place').value;

    const newLead = { name, phone, place, role: 'executive' };

    if (!navigator.onLine) {
        const offlineLeads = JSON.parse(localStorage.getItem('offlineLeads') || '[]');
        offlineLeads.push(newLead);
        localStorage.setItem('offlineLeads', JSON.stringify(offlineLeads));
        alert('You are offline. Lead saved locally and will sync when back online.');
        document.getElementById('addLeadForm').reset();
        return;
    }

    const response = await fetch(`${API_BASE}/leads/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newLead)
    });

    const data = await response.json();
    if (response.ok) {
        alert('Lead added successfully');
        document.getElementById('addLeadForm').reset();
        fetchLeads();
    } else {
        alert('Error: ' + data.detail);
    }
});

// Fetch and display all leads
async function fetchLeads() {
    const response = await fetch(`${API_BASE}/leads/all`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const leads = await response.json();
    const tableBody = document.getElementById('leadsTableBody');
    tableBody.innerHTML = '';

    leads.forEach(lead => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input value="${lead.name}" onchange="handleEdit(${lead.id}, 'name', this.value)"></td>
            <td><input value="${lead.phone}" onchange="handleEdit(${lead.id}, 'phone', this.value)"></td>
            <td><input value="${lead.place}" onchange="handleEdit(${lead.id}, 'place', this.value)"></td>
            <td>${lead.created_by}</td>
            <td><button onclick="archiveLead(${lead.id})">Archive</button></td>
        `;
        tableBody.appendChild(row);
    });
}

// Edit lead - online or offline
function handleEdit(id, field, value) {
    if (!navigator.onLine) {
        const pendingEdits = JSON.parse(localStorage.getItem('pendingEdits') || '[]');
        pendingEdits.push({ id, field, value });
        localStorage.setItem('pendingEdits', JSON.stringify(pendingEdits));
        alert('Offline: Change saved locally and will sync when back online.');
        return;
    }

    updateLead(id, field, value);
}

// Update lead (online only)
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

// Archive lead
async function archiveLead(id) {
    if (!confirm("Are you sure you want to archive this lead?")) return;
    // Placeholder for now
    alert("Lead archived (placeholder)");
}

// Search through leads
function searchLeads() {
    const filter = document.getElementById('searchInput').value.toUpperCase();
    const rows = document.getElementById('leadsTableBody').getElementsByTagName('tr');
    Array.from(rows).forEach(row => {
        const cells = row.getElementsByTagName('td');
        const name = cells[0].querySelector('input')?.value || '';
        const phone = cells[1].querySelector('input')?.value || '';
        const place = cells[2].querySelector('input')?.value || '';

        if (name.toUpperCase().includes(filter) || phone.toUpperCase().includes(filter) || place.toUpperCase().includes(filter)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Sync offline data
async function syncOfflineData() {
    const token = sessionStorage.getItem('token');

    // Sync offline leads
    const offlineLeads = JSON.parse(localStorage.getItem('offlineLeads') || '[]');
    for (const lead of offlineLeads) {
        await fetch(`${API_BASE}/leads/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(lead),
        });
    }
    if (offlineLeads.length) {
        alert('Offline leads synced!');
        localStorage.removeItem('offlineLeads');
    }

    // Sync pending edits
    const pendingEdits = JSON.parse(localStorage.getItem('pendingEdits') || '[]');
    const grouped = {};

    // Group edits by lead ID
    for (const edit of pendingEdits) {
        if (!grouped[edit.id]) grouped[edit.id] = {};
        grouped[edit.id][edit.field] = edit.value;
    }

    for (const id in grouped) {
        await fetch(`${API_BASE}/leads/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(grouped[id]),
        });
    }

    if (pendingEdits.length) {
        alert('Offline edits synced!');
        localStorage.removeItem('pendingEdits');
    }

    fetchLeads();
}

// Listen for reconnection
window.addEventListener('online', syncOfflineData);

// Initial load
fetchLeads();
