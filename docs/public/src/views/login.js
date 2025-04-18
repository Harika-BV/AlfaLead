import { requestOtp, verifyOtp } from '../api.js';
import { saveAuth } from '../auth.js';

export function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="space-y-6 p-8 bg-white rounded-xl shadow-lg">
      <img src="/logo.svg" class="w-16 mx-auto" />
      <h1 class="text-2xl font-bold text-center">AlfaLead</h1>
      <p class="text-center text-gray-600">a lead management software</p>
      <input id="phone" type="text" placeholder="Phone number" class="w-full px-4 py-2 border rounded-lg" />
      <label class="flex items-center space-x-2">
        <input id="agree" type="checkbox" />
        <span class="text-sm">I agree to T&C</span>
      </label>
      <button id="reqBtn" class="w-full py-3 bg-indigo-600 text-white rounded-lg">Request OTP</button>
      <div id="otpSection" class="hidden space-y-2">
        <input id="otp" type="text" placeholder="Enter OTP" class="w-full px-4 py-2 border rounded-lg" />
        <button id="verifyBtn" class="w-full py-3 bg-indigo-600 text-white rounded-lg">Verify</button>
      </div>
      <p id="error" class="text-red-500 text-sm"></p>
    </div>
  `;

  document.getElementById('reqBtn').onclick = async () => {
    const phone = document.getElementById('phone').value;
    if (!document.getElementById('agree').checked) {
      return (document.getElementById('error').textContent = 'Please accept T&C');
    }
    await requestOtp(phone);
    document.getElementById('otpSection').classList.remove('hidden');
  };

  document.getElementById('verifyBtn').onclick = async () => {
    const phone = document.getElementById('phone').value;
    const otp   = document.getElementById('otp').value;
    try {
      const { token, role } = await verifyOtp(phone, otp);
      saveAuth({ token, role });
      window.location.hash = `#/${role}`;
    } catch (e) {
      document.getElementById('error').textContent = 'Invalid OTP';
    }
  };
}
