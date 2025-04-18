const API_BASE = "https://web-production-df1bf.up.railway.app";  // Backend API base URL

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
    const token = sessionStorage.getItem('token');

    const response = await fetch(`${API_BASE}/leads/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone, place })
    });

    const data = await response.json();
    if (response.status === 200) {
        alert('Lead added successfully');
        // Optionally clear form fields
        document.getElementById('addLeadForm').reset();
        fetchLeads();  // Refresh the leads list
    } else {
        alert('Error: ' + data.detail);
    }
});

// Fetch and display all leads
async function fetchLeads() {
    const token = sessionStorage.getItem('token');
    const response = await fetch(`${API_BASE}/leads/all`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        }
    });
    const leads = await response.json();
    const tableBody = document.getElementById('leadsTableBody');
    tableBody.innerHTML = '';

    leads.forEach(lead => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${lead.name}</td>
            <td>${lead.phone}</td>
            <td>${lead.place}</td>
            <td>
                <button onclick="editLead(${lead.id})">Edit</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Edit lead functionality (show in form to edit)
function editLead(leadId) {
    // You can show a modal here to edit lead details
    alert('Edit lead functionality is under development');
}

// Search through leads
function searchLeads() {
    const filter = document.getElementById('searchInput').value.toUpperCase();
    const rows = document.getElementById('leadsTableBody').getElementsByTagName('tr');
    Array.from(rows).forEach(row => {
        const cells = row.getElementsByTagName('td');
        const name = cells[0].textContent || cells[0].innerText;
        const phone = cells[1].textContent || cells[1].innerText;
        const place = cells[2].textContent || cells[2].innerText;
        
        if (name.toUpperCase().includes(filter) || phone.toUpperCase().includes(filter) || place.toUpperCase().includes(filter)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Initial load of leads when the page is loaded
fetchLeads();
