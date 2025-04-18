import { openDB } from 'https://unpkg.com/idb@7.1.1?module';

export const dbPromise = openDB('alfalead-db', 1, {
  upgrade(db) {
    db.createObjectStore('outbox', { keyPath: 'tempId', autoIncrement: true });
    db.createObjectStore('leads', { keyPath: 'id' });
  }
});

// queue lead for offline sync
export async function queueLead(lead) {
  const db = await dbPromise;
  await db.add('outbox', lead);
}

// store/fetch leads locally
export async function saveLeadLocally(lead) {
  const db = await dbPromise;
  await db.put('leads', lead);
}

export async function getLocalLeads() {
  const db = await dbPromise;
  return db.getAll('leads');
}

// pull queued items
export async function getOutbox() {
  const db = await dbPromise;
  return db.getAll('outbox');
}

export async function clearOutboxItem(tempId) {
  const db = await dbPromise;
  await db.delete('outbox', tempId);
}
