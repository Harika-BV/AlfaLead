import { requestOtp, verifyOtp } from './api.js';

const phoneForm = document.getElementById('phone-form');
const phoneInput = document.getElementById('phone');
const otpForm   = document.getElementById('otp-form');
const loginErr  = document.getElementById('login-error');
const otpErr    = document.getElementById('otp-error');
const otpFullInput = document.getElementById('otp-full');

phoneForm.onsubmit = async e => {
  e.preventDefault();
  loginErr.textContent = '';
  const phone = phoneInput.value;
  try {
    await requestOtp(phone);
    phoneForm.classList.add('hidden');
    otpForm.classList.remove('hidden');
  } catch {
    loginErr.textContent = 'Failed to request OTP';
  }
};

otpForm.onsubmit = async e => {
  e.preventDefault();
  otpErr.textContent = '';
  const code = Array.from(otpForm.querySelectorAll('.otp-field'))
                .map(i=>i.value).join('');
  const desktopCode = otpFullInput.value.trim()
  const otpToVerify = code.length === 6 
  ? code 
  : desktopCode;

  // only proceed if we actually have something
  if (otpToVerify) {
    try {
      const { token, role } = await verifyOtp(phoneInput.value.trim(), otpToVerify);
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('phone', phoneInput.value.trim());
      window.location.href = `${role}.html`;
    } catch (err) {
      otpErr.textContent = 'Invalid OTP';
    }
  } else {
     otpErr.textContent = 'Please enter the 6-digit code';
  }

};
