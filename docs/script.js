const form = document.getElementById('lead-form');
const status = document.getElementById('status');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const lead = {
    name: document.getElementById('name').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    note: document.getElementById('note').value.trim(),
    timestamp: new Date().toISOString()
  };

  if (navigator.onLine) {
    // Try to send to backend
    try {
      const res = await fetch('http://localhost:8001/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([lead])
      });

      if (res.ok) {
        status.textContent = '✅ Lead synced to server!';
        form.reset();
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      cacheLead(lead);
    }
  } else {
    cacheLead(lead);
  }
});

function cacheLead(lead) {
  let leads = JSON.parse(localStorage.getItem('leads') || '[]');
  leads.push(lead);
  localStorage.setItem('leads', JSON.stringify(leads));
  status.textContent = '📦 Offline — lead cached locally.';
  form.reset();
}

// Try to sync cached leads when back online
window.addEventListener('online', syncLeads); // still needed

window.addEventListener('load', () => {
  if (navigator.onLine) {
    syncLeads(); // 🔁 trigger sync on refresh/load if online
  }
});

async function syncLeads() {
  let leads = JSON.parse(localStorage.getItem('leads') || '[]');
  if (leads.length === 0) return;

  try {
    const res = await fetch('http://localhost:8001/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leads)
    });

    if (res.ok) {
      localStorage.removeItem('leads');
      status.textContent = '🔄 Cached leads synced!';
    }
  } catch (err) {
    console.log('Sync failed:', err);
  }
}
