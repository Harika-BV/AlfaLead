import { isAuthenticated, getRole } from './auth.js';
import { renderLogin } from './views/login.js';
import { renderPromotor } from './views/promotor.js';
import { renderExecutive } from './views/executive.js';
import { renderAdmin } from './views/admin.js';

const routes = {
  '/login': renderLogin,
  '/promotor': renderPromotor,
  '/executive': renderExecutive,
  '/admin': renderAdmin,
};

export function router() {
  const hash = window.location.hash.replace('#','') || '/login';
  if (hash !== '/login' && !isAuthenticated()) {
    return window.location.hash = '#/login';
  }
  const role = getRole();
  if (hash === '/login') {
    return routes['/login']();
  }
  // enforce role-based landing
  if (hash === '/promotor' && role==='promotor') return routes['/promotor']();
  if (hash === '/executive' && role==='executive') return routes['/executive']();
  if (hash === '/admin' && role==='admin') return routes['/admin']();
  // redirect to correct home if mismatch
  window.location.hash = `#/${role}`;
}
