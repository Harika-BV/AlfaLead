const API = window.API_BASE;

const phoneInput = document.getElementById('phone-input');
const termsCheckbox = document.getElementById('terms-checkbox');
const requestOtpBtn = document.getElementById('request-otp-btn');
const otpSection = document.getElementById('otp-section');
const otpInput = document.getElementById('otp-input');
const verifyOtpBtn = document.getElementById('verify-otp-btn');
let currentPhone = '';

function updateRequestButton() {
  requestOtpBtn.disabled = !(phoneInput.value.trim() && termsCheckbox.checked);
}

function updateVerifyButton() {
  verifyOtpBtn.disabled = otpInput.value.trim().length !== 4;
}

phoneInput.addEventListener('input', updateRequestButton);
termsCheckbox.addEventListener('change', updateRequestButton);

requestOtpBtn.addEventListener('click', async () => {
  currentPhone = phoneInput.value.trim();
  try {
    const res = await fetch(`${API}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: currentPhone })
    });
    const data = await res.json();
    alert(`Your OTP is: ${data.otp}`);
    otpSection.classList.remove('hidden');
    requestOtpBtn.disabled = true;
  } catch (err) {
    console.error(err);
    alert('Failed to request OTP.');
  }
});

otpInput.addEventListener('input', updateVerifyButton);

verifyOtpBtn.addEventListener('click', async () => {
  const otp = otpInput.value.trim();
  try {
    const res = await fetch(`${API}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: currentPhone, otp })
    });
    if (!res.ok) throw new Error('Invalid OTP');
    const { token } = await res.json();
    localStorage.setItem('token', token);
    localStorage.setItem('phone', currentPhone);
    const adminsRes = await fetch(`${API}/admin/admins`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (adminsRes.ok) {
      const admins = await adminsRes.json();
      const isAdmin = admins.some(a => a.phone === currentPhone);
      window.location.href = isAdmin ? 'admin.html' : 'user.html';
    } else {
      window.location.href = 'user.html';
    }
  } catch (err) {
    console.error(err);
    alert(err.message || 'OTP verification failed');
  }
});