// Base URL of your FastAPI server
const BASE = 'https://web-production-7b51.up.railway.app';

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
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

// Leads
export async function fetchLeads(role) {
  const path = role==='promotor'? '/leads/my':'/leads';
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch leads');
  return res.json();
}
export async function createLead(data) {
  const res = await fetch(`${BASE}/leads`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create lead');
  return res.json();
}
export async function updateLead(id, data) {
  const res = await fetch(`${BASE}/leads/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update lead');
  return res.json();
}

// Users (Admin)
export async function fetchUsers() {
  const res = await fetch(`${BASE}/users/all`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}
export async function createUser(user) {
  const res = await fetch(`${BASE}/users/create`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(user)
  });
  if (!res.ok) throw new Error('Failed to create user');
  return res.json();
}

const otpFields  = Array.from(document.querySelectorAll('.otp-field'));

otpFields.forEach((field, idx) => {
  // move forward on input
  field.addEventListener('input', () => {
    if (field.value.length === 1 && idx < otpFields.length - 1) {
      otpFields[idx + 1].focus();
    }
  });

  // move back on backspace when empty
  field.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !field.value && idx > 0) {
      otpFields[idx - 1].focus();
    }
  });
});
