import { queueLead, clearOutboxItem } from './db.js';

// base URL to your FastAPI server
const BASE = 'http://localhost:8001';

function authHeaders() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// Auth
export async function requestOtp(phone) {
  const res = await fetch(`${BASE}/auth/request-otp`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({phone})
  });
  return res.json();
}

export async function verifyOtp(phone, otp) {
  const res = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({phone, otp})
  });
  return res.json();
}

// CRUD Leads
export async function createLead(lead) {
  if (!navigator.onLine) {
    // queue for sync
    await queueLead(lead);
    return { offline: true };
  }
  return fetch(`${BASE}/leads`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(lead)
  }).then(r => r.json());
}

export async function updateLead(id, data) {
  if (!navigator.onLine) {
    await queueLead({ id, ...data });
    return { offline: true };
  }
  return fetch(`${BASE}/leads/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  }).then(r => r.json());
}

export async function fetchLeads(role) {
  const path = role === 'promotor' ? '/leads/my' : '/leads';
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  return res.json();
}

export async function fetchUsers() {
  const res = await fetch(`${BASE}/users/all`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`fetchUsers failed (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function createUser(user) {
  // user = { phone, name, role }
  const res = await fetch(`${BASE}/users/create`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(user),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `createUser failed (${res.status})`);
  }
  return res.json();
}

// sync outbox when back online
window.addEventListener('online', async () => {
  const queue = await getOutbox();
  for (const item of queue) {
    if (item.id) {
      await updateLead(item.id, item);
    } else {
      await fetch(`${BASE}/leads`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(item)
      });
    }
    await clearOutboxItem(item.tempId);
  }
});

