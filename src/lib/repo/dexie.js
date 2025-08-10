import { Dexie, liveQuery } from 'dexie';

const db = new Dexie('fiddleristocracy');

// Catalog = projection for fast queries; Docs = opaque content blob (string for now)
db.version(1).stores({
  catalog: 'id, createdAt',
  docs: 'id'
});

export { db, liveQuery }; 