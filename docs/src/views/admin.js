// src/views/admin.js
import { fetchLeads, updateLead } from '../api.js';
import { fetchUsers, createUser } from '../api.js';

export async function renderAdmin() {
  console.log('🚀 renderAdmin called');
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="flex flex-col h-screen">

      <!-- Header -->
      <header class="flex items-center justify-between p-4 bg-white shadow">
        <h1 class="text-xl font-semibold">Admin Panel</h1>
        <button id="logoutBtn" class="text-gray-600 hover:text-gray-800">🔒</button>
      </header>

      <!-- Tabs -->
      <nav class="flex bg-gray-100 p-2">
        <button id="tabLeads" class="flex-1 py-2 text-center font-medium">Leads</button>
        <button id="tabUsers" class="flex-1 py-2 text-center font-medium">Users</button>
      </nav>

      <!-- Content -->
      <main id="mainContent" class="flex-1 overflow-y-auto p-4 bg-gray-50"></main>
    </div>
  `;

  document.getElementById('logoutBtn').onclick = () => {
    localStorage.clear();
    window.location.hash = '#/login';
  };

  // Render Leads table
  async function showLeadsTab() {
    const main = document.getElementById('mainContent');
    main.innerHTML = `
      <table class="min-w-full bg-white rounded-lg shadow">
        <thead>
          <tr class="bg-gray-200">
            <th class="px-4 py-2">ID</th>
            <th class="px-4 py-2">Name</th>
            <th class="px-4 py-2">Place</th>
            <th class="px-4 py-2">Created At</th>
            <th class="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody id="leadsBody"></tbody>
      </table>
    `;
    let leads = [];
    try {
      leads = await fetchLeads('admin');
    } catch (e) {
      console.error('fetchLeads', e);
    }
    const body = document.getElementById('leadsBody');
    leads.forEach(l => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="border px-4 py-2">${l.id}</td>
        <td class="border px-4 py-2"><input class="w-full" value="${l.name}"/></td>
        <td class="border px-4 py-2"><input class="w-full" value="${l.place}"/></td>
        <td class="border px-4 py-2">${new Date(l.created_at).toLocaleString()}</td>
        <td class="border px-4 py-2 text-center">
          <button data-id="${l.id}" class="saveLead px-2 py-1 bg-blue-600 text-white rounded">Save</button>
        </td>
      `;
      body.appendChild(tr);
    });
    body.querySelectorAll('.saveLead').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const row = btn.closest('tr');
        const name = row.querySelectorAll('input')[0].value;
        const place= row.querySelectorAll('input')[1].value;
        try {
          await updateLead(id, { name, place });
          alert('Lead updated');
        } catch {
          alert('Update failed');
        }
      };
    });
  }

  // Render Users table
  async function showUsersTab() {
    const main = document.getElementById('mainContent');
    main.innerHTML = `
      <div class="space-y-4">
        <form id="userForm" class="flex space-x-2">
          <input id="newPhone" placeholder="Phone" class="px-3 py-2 border rounded"/>
          <input id="newName"  placeholder="Name"  class="px-3 py-2 border rounded"/>
          <select id="newRole" class="px-3 py-2 border rounded">
            <option value="">Role</option>
            <option value="promotor">Promotor</option>
            <option value="executive">Executive</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded">Add</button>
        </form>
        <table class="min-w-full bg-white rounded-lg shadow">
          <thead><tr class="bg-gray-200">
            <th class="px-4 py-2">Phone</th>
            <th class="px-4 py-2">Name</th>
            <th class="px-4 py-2">Role</th>
          </tr></thead>
          <tbody id="usersBody"></tbody>
        </table>
      </div>
    `;
    document.getElementById('userForm').onsubmit = async (e) => {
      e.preventDefault();
      const phone = document.getElementById('newPhone').value;
      const name  = document.getElementById('newName').value;
      const role  = document.getElementById('newRole').value;
      try {
        await createUser({ phone, name, role });
        showUsersTab();
      } catch {
        alert('Add user failed');
      }
    };
    let users = [];
    try {
      users = await fetchUsers();
    } catch (e) {
      console.error('fetchUsers', e);
    }
    const body = document.getElementById('usersBody');
    users.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="border px-4 py-2">${u.phone}</td>
        <td class="border px-4 py-2">${u.name}</td>
        <td class="border px-4 py-2">${u.role}</td>
      `;
      body.appendChild(tr);
    });
  }

  // Tab wiring
  document.getElementById('tabLeads').onclick = () => {
    document.getElementById('tabLeads').classList.add('bg-white');
    document.getElementById('tabUsers').classList.remove('bg-white');
    showLeadsTab();
  };
  document.getElementById('tabUsers').onclick = () => {
    document.getElementById('tabUsers').classList.add('bg-white');
    document.getElementById('tabLeads').classList.remove('bg-white');
    showUsersTab();
  };

  // Start on Leads tab
  document.getElementById('tabLeads').classList.add('bg-white');
  showLeadsTab();
}
