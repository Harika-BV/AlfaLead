const API = window.API_BASE;

import { Model, Recognizer } from 'https://unpkg.com/vosk-browser/dist/index.mjs';


(async () => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'index.html'; return; }
    const headers = { 'Authorization': `Bearer ${token}` };
  
    async function loadTodayLeads() {
      try {
        const res = await fetch(`${API}/leads/today`, { headers });
        const { count } = await res.json();
        document.getElementById('lead-count').textContent = count;
      } catch (err) { console.error(err); }
    }
  
    await loadTodayLeads();
  
    const searchInput = document.getElementById('doctor-search');
    const listEl = document.getElementById('doctor-list');
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(async () => {
        const q = searchInput.value.trim();
        try {
          const res = await fetch(`${API}/doctors?search=${encodeURIComponent(q)}`, { headers });
          const doctors = await res.json();
          listEl.innerHTML = '';
          doctors.forEach(d => {
            const li = document.createElement('li');
            li.textContent = `${d.name} (${d.phone}) - ${d.place}`;
            li.className = 'px-2 py-1 hover:bg-gray-100 cursor-pointer';
            li.addEventListener('click', () => {
              const newName = prompt('Edit name:', d.name);
              if (newName !== null) {
                alert('Updated locally: ' + newName);
              }
            });
            listEl.appendChild(li);
          });
        } catch (err) { console.error(err); }
      }, 300);
    });
  
    function openDB() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open('alfa-lead-db', 1);
        req.onupgradeneeded = e => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('leads')) {
            db.createObjectStore('leads', { keyPath: 'id', autoIncrement: true });
          }
        };
        req.onsuccess = e => resolve(e.target.result);
        req.onerror = e => reject(e.target.error);
      });
    }
  
    function saveLeadOffline(lead) {
      openDB().then(db => {
        const tx = db.transaction('leads', 'readwrite');
        tx.objectStore('leads').add(lead);
      });
    }
  
    async function syncLeads() {
      if (!navigator.onLine) return;
      const db = await openDB();
      const tx = db.transaction('leads', 'readwrite');
      const store = tx.objectStore('leads');
      const all = await new Promise((res, rej) => {
        const r = store.getAll();
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
      for (const l of all) {
        try {
          await fetch(`${API}/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': headers['Authorization'] },
            body: JSON.stringify(l)
          });
          store.delete(l.id);
        } catch (err) {
          console.error('Sync failed for lead', l, err);
        }
      }
    }
  
    window.addEventListener('online', syncLeads);
  
    document.getElementById('capture-ocr-btn').addEventListener('click', async () => {
      // Open camera or file picker:
      const file = await new Promise(resolve => {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = 'image/*';
        inp.onchange = () => resolve(inp.files[0]);
        inp.click();
      });
    
      const { data: { text } } = await Tesseract.recognize(
        file,
        'eng',
        { logger: m => console.log(m) }
      );
    
      // Simple parsing (you’ll want more robust regex)
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      alert('OCR Result:\n' + lines.join('\n'));
      // populate your form fields here
    });
    
    document.getElementById('record-speech-btn').addEventListener('click', async () => {
      const model = new Model('/vosk-model');  // path to your model folder
      const rec = new Recognizer({ model, sampleRate: 48000 });
    
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    
      source.connect(processor);
      processor.connect(audioCtx.destination);
    
      processor.onaudioprocess = evt => {
        const chunk = evt.inputBuffer.getChannelData(0);
        rec.acceptWaveform(chunk);
      };
    
      // Stop after 5 seconds (or provide a “Stop” button)
      setTimeout(() => {
        processor.disconnect();
        source.disconnect();
        const result = rec.finalResult();
        alert('Speech → Text:\n' + result.text);
        // populate form fields here
        rec.free();
        model.free();
      }, 5000);
    });

    
  })();