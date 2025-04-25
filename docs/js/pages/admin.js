import {
  fetchLeads,
  updateLead,
  fetchUsers,
  createUser
} from '../api.js';

// right at the top of admin.js
const userRole = localStorage.getItem('role');
if (userRole !== 'admin') {
  alert('You’re not authorized to view this page.');
  window.location.replace('');
  // stop any further JS
  throw new Error('Unauthorized');
}

// grab DOM
const offlineBanner = document.getElementById('offlineBanner');
const logoutBtn     = document.getElementById('logoutBtn');
const tabLeads      = document.getElementById('tabLeads');
const tabUsers      = document.getElementById('tabUsers');
const mainContent   = document.getElementById('mainContent');

// Logout
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

// ----- Leads Tab -----
async function showLeadsTab() {
  mainContent.innerHTML = `
    <div class="search-filter">
      <input
        id="leadsSearch"
        class="search-input"
        type="text"
        placeholder="Search leads…"
      />
    </div>
    <div class="leads-list" id="leadsList"></div>
    <div class="leads-table-container">
      <table class="leads-table" id="leadsTable">
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Place</th><th>Created</th>
          </tr>
        </thead>
        <tbody id="leadsBody"></tbody>
      </table>
    </div>
  `;

  // fetch & render
  const leads = await fetchLeads('admin');
  const listEl = document.getElementById('leadsList');
  const bodyEl = document.getElementById('leadsBody');

  leads.forEach(l => {
    // mobile card
    const card = document.createElement('div');
    card.className = 'lead-card';
    card.innerHTML = `
      <div class="name">#${l.id} – ${l.name}</div>
      <div class="meta">${l.place}<br/><span class="date">${new Date(l.created_at).toLocaleDateString()}</span></div>
    `;
    listEl.appendChild(card);

    // desktop row
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${l.id}</td>
      <td>${l.name}</td>
      <td>${l.place}</td>
      <td>${new Date(l.created_at).toLocaleDateString()}</td>
    `;
    bodyEl.appendChild(tr);
  });

  // search filter
  document.getElementById('leadsSearch').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    // filter cards
    Array.from(listEl.children).forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? '' : 'none';
    });
    // filter table rows
    Array.from(bodyEl.children).forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? '' : 'none';
    });
  });
}

// ----- Users Tab -----
async function showUsersTab() {
  mainContent.innerHTML = `
    <form id="userForm" class="user-form">
      <input id="newPhone" placeholder="Phone Number" required/>
      <input id="newName"  placeholder="Full Name"    required/>
      <select id="newRole" required>
        <option value="">Select Role</option>
        <option value="promotor">Promotor</option>
        <option value="executive">Executive</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit" class="btn primary full">Add User</button>
    </form>
    <div class="search-filter">
      <input
        id="usersSearch"
        class="search-input"
        type="text"
        placeholder="Search users…"
      />
    </div>
    <div class="users-list" id="usersList"></div>
    <div class="users-table-container">
      <table class="users-table" id="usersTable">
        <thead>
          <tr><th>Phone</th><th>Name</th><th>Role</th></tr>
        </thead>
        <tbody id="usersBody"></tbody>
      </table>
    </div>
  `;

  // Add User form
  document.getElementById('userForm').onsubmit = async e => {
    e.preventDefault();
    const user = {
      phone: document.getElementById('newPhone').value.trim(),
      name:  document.getElementById('newName').value.trim(),
      role:  document.getElementById('newRole').value
    };
    await createUser(user);
    showUsersTab();
  };

  // Fetch & render
  const users = await fetchUsers();
  const listEl  = document.getElementById('usersList');
  const bodyEl  = document.getElementById('usersBody');
  listEl.innerHTML = '';
  bodyEl.innerHTML = '';

  users.forEach(u => {
    // mobile card
    const card = document.createElement('div');
    card.className = 'user-card';
    card.innerHTML = `
      <div class="user-name">${u.name}</div>
      <div class="user-meta">
        ${u.phone}<br/><span>${u.role}</span>
      </div>
    `;
    listEl.appendChild(card);

    // desktop row
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.phone}</td><td>${u.name}</td><td>${u.role}</td>
    `;
    bodyEl.appendChild(tr);
  });

  // search filter
  document.getElementById('usersSearch').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    Array.from(listEl.children).forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? '' : 'none';
    });
    Array.from(bodyEl.children).forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? '' : 'none';
    });
  });
}

// Tab wiring
tabLeads.onclick = () => {
  tabLeads.classList.add('active');
  tabUsers.classList.remove('active');
  showLeadsTab();
};
tabUsers.onclick = () => {
  tabUsers.classList.add('active');
  tabLeads.classList.remove('active');
  showUsersTab();
};

// Initial load
showLeadsTab();
