const API_BASE = "https://web-production-df1bf.up.railway.app"; // change to backend URL when deployed

function requestOTP() {
  const phone = document.getElementById("phone").value;
  fetch(`${API_BASE}/otp/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone })
  })
    .then(res => {
      if (!res.ok) throw new Error("User not found");
      return res.json();
    })
    .then(() => {
      document.getElementById("step1").style.display = "none";
      document.getElementById("step2").style.display = "block";
    })
    .catch(err => showError(err.message));
}

function verifyOTP() {
  const phone = document.getElementById("phone").value;
  const otp = document.getElementById("otp").value;
  fetch(`${API_BASE}/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp })
  })
    .then(res => {
      if (!res.ok) throw new Error("Invalid OTP");
      return res.json();
    })
    .then(data => {
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("role", data.role);
      redirectByRole(data.role);
    })
    .catch(err => showError(err.message));
}

function redirectByRole(role) {
  if (role === "admin") window.location.href = "/admin.html";
  else if (role === "executive") window.location.href = "/executive.html";
  else if (role === "promotor") window.location.href = "/promotor.html";
  else showError("Unknown role");
}

function showError(msg) {
  const errDiv = document.getElementById("error");
  errDiv.textContent = msg;
  errDiv.style.color = "red";
}