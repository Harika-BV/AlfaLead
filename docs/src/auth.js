export function saveAuth({ token, role }) {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('authExpiry', Date.now() + 24*60*60*1000);
  }
  
  export function isAuthenticated() {
    return localStorage.getItem('token') &&
           Date.now() < +localStorage.getItem('authExpiry');
  }
  
  export function getRole() {
    return localStorage.getItem('role');
  }
  
  export function logout() {
    localStorage.clear();
    window.location.hash = '#/login';
  }
  