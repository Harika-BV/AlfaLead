import { router } from './router.js';

// register SW
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// initial render + listen for hash changes
window.addEventListener('load', router);
window.addEventListener('hashchange', router);
