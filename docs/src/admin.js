const API = window.API_BASE;

const fromInput = document.getElementById('filter-from');
const toInput   = document.getElementById('filter-to');
const userSel   = document.getElementById('filter-user');
const docInput  = document.getElementById('filter-doctor');
const tableBody = document.querySelector('#leads-table tbody');

async function loadUsers() {
  const res = await fetch(`${API}/admin/admins`, { headers });
  const admins = await res.json();
  userSel.innerHTML = `<option value="">All</option>` +
    admins.map(a => `<option value="${a.phone}">${a.name}</option>`).join('');
}
await loadUsers();

async function loadLeads() {
  const params = new URLSearchParams();
  if (fromInput.value) params.append('from', fromInput.value);
  if (toInput.value)   params.append('to', toInput.value);
  if (userSel.value)   params.append('user', userSel.value);
  if (docInput.value)  params.append('doctor', docInput.value);

  const res = await fetch(`${API}/admin/leads?${params}`, { headers });
  const leads = await res.json();
  tableBody.innerHTML = leads.map(l => `
    <tr>
      <td class="border px-2 py-1">${new Date(l.created_at).toLocaleDateString()}</td>
      <td class="border px-2 py-1">${l.user_phone}</td>
      <td class="border px-2 py-1">${l.doctor_name || l.doctor_id}</td>
      <td class="border px-2 py-1">${l.comments||''}</td>
    </tr>
  `).join('');
}

document.getElementById('apply-filters').addEventListener('click', loadLeads);

// initial load
loadLeads();


(async () => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'index.html'; return; }
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  
    try {
      const resStats = await fetch(`${API}/admin/stats`, { headers });
      const stats = await resStats.json();
      document.getElementById('stats-today').textContent = stats.todayLeads;
      document.getElementById('stats-users').textContent = stats.totalUsers;
    } catch (err) { console.error(err); }
  
    const adminList = document.getElementById('admin-list');
    async function loadAdmins() {
      try {
        const res = await fetch(`${API}/admin/admins`, { headers });
        const admins = await res.json();
        adminList.innerHTML = '';
        admins.forEach(a => {
          const li = document.createElement('li');
          li.textContent = `${a.name} (${a.phone})`;
          adminList.appendChild(li);
        });
      } catch (err) { console.error(err); }
    }
    await loadAdmins();
  
    document.getElementById('add-admin-btn').addEventListener('click', async () => {
      const name = prompt('Admin name:');
      const phone = prompt('Admin phone:');
      if (name && phone) {
        try {
          await fetch(`${API}/admin/admins`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name, phone })
          });
          await loadAdmins();
        } catch (err) { console.error(err); }
      }
    });
  })();