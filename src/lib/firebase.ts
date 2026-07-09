import { generateId } from './utils';

const bc = new BroadcastChannel('serenity-db');

const getDb = () => {
  const data = localStorage.getItem('serenity-db');
  return data ? JSON.parse(data) : {};
};

const saveDb = (data: any) => {
  localStorage.setItem('serenity-db', JSON.stringify(data));
  bc.postMessage({ type: 'update' });
  window.dispatchEvent(new Event('serenity-db-update'));
};

export const db = {};
export const auth = {
  currentUser: null as any,
  onAuthStateChangedListeners: [] as any[],
};

export const onAuthStateChanged = (auth: any, cb: any) => {
  auth.onAuthStateChangedListeners.push(cb);
  const userStr = localStorage.getItem('serenity-auth');
  if (userStr) {
    const u = JSON.parse(userStr);
    auth.currentUser = u;
    cb(u);
  } else {
    cb(null);
  }
};

export const loginAnonymously = async () => {
  const uid = generateId();
  const user = { uid };
  localStorage.setItem('serenity-auth', JSON.stringify(user));
  auth.currentUser = user;
  auth.onAuthStateChangedListeners.forEach(cb => cb(user));
  return { user };
};

export const signOut = async (auth: any) => {
  localStorage.removeItem('serenity-auth');
  auth.currentUser = null;
  auth.onAuthStateChangedListeners.forEach(cb => cb(null));
};

export const doc = (db: any, path: string, ...rest: string[]) => {
  return { path: [path, ...rest].join('/'), type: 'doc' };
};

export const collection = (db: any, path: string, ...rest: string[]) => {
  return { path: [path, ...rest].join('/'), type: 'collection' };
};

export const getDoc = async (ref: any) => {
  const dbData = getDb();
  const data = dbData[ref.path];
  return {
    exists: () => !!data,
    data: () => data,
    id: ref.path.split('/').pop()
  };
};

export const setDoc = async (ref: any, data: any, options?: any) => {
  const dbData = getDb();
  if (options?.merge && dbData[ref.path]) {
    dbData[ref.path] = { ...dbData[ref.path], ...data };
  } else {
    dbData[ref.path] = data;
  }
  
  const pathParts = ref.path.split('/');
  const id = pathParts.pop();
  const colPath = pathParts.join('/');
  if (!dbData[colPath]) dbData[colPath] = [];
  if (!dbData[colPath].includes(id)) dbData[colPath].push(id);
  
  saveDb(dbData);
};

export const updateDoc = async (ref: any, data: any) => {
  const dbData = getDb();
  if (dbData[ref.path]) {
    dbData[ref.path] = { ...dbData[ref.path], ...data };
    saveDb(dbData);
  }
};

export const deleteDoc = async (ref: any) => {
  const dbData = getDb();
  delete dbData[ref.path];
  
  const pathParts = ref.path.split('/');
  const id = pathParts.pop();
  const colPath = pathParts.join('/');
  if (dbData[colPath]) {
    dbData[colPath] = dbData[colPath].filter((x: string) => x !== id);
  }
  
  saveDb(dbData);
};

export const addDoc = async (ref: any, data: any) => {
  const dbData = getDb();
  const id = generateId();
  const docPath = `${ref.path}/${id}`;
  dbData[docPath] = data;
  
  if (!dbData[ref.path]) dbData[ref.path] = [];
  dbData[ref.path].push(id);
  
  saveDb(dbData);
  return { id, path: docPath };
};

export const serverTimestamp = () => Date.now();

export const query = (ref: any, ...constraints: any[]) => {
  return { path: ref.path, type: 'query', constraints };
};

export const where = (field: string, op: string, value: any) => ({ type: 'where', field, op, value });
export const orderBy = (field: string, dir: string) => ({ type: 'orderBy', field, dir });
export const limit = (n: number) => ({ type: 'limit', n });

export const getDocs = async (q: any) => {
  const dbData = getDb();
  let ids = dbData[q.path] || [];
  
  let docs = ids.map((id: string) => ({ id, data: () => dbData[`${q.path}/${id}`] })).filter((d: any) => !!d.data());
  
  q.constraints?.forEach((c: any) => {
    if (c.type === 'where') {
      docs = docs.filter((d: any) => {
        const val = d.data()[c.field];
        if (c.op === '==') return val === c.value;
        return true;
      });
    }
  });
  
  return {
    empty: docs.length === 0,
    docs,
    forEach: (cb: any) => docs.forEach(cb)
  };
};

export const onSnapshot = (refOrQuery: any, cb: any) => {
  const isDoc = refOrQuery.type === 'doc';
  let prevDocs: Record<string, any> = {};
  
  const notify = () => {
    const dbData = getDb();
    if (isDoc) {
      const data = dbData[refOrQuery.path];
      cb({
        exists: () => !!data,
        data: () => data,
        id: refOrQuery.path.split('/').pop()
      });
    } else {
      let ids = dbData[refOrQuery.path] || [];
      let docs = ids.map((id: string) => ({ 
        id, 
        data: () => dbData[`${refOrQuery.path}/${id}`],
        ref: { path: `${refOrQuery.path}/${id}` }
      })).filter((d: any) => !!d.data());
      
      refOrQuery.constraints?.forEach((c: any) => {
        if (c.type === 'where') {
          docs = docs.filter((d: any) => {
            const val = d.data()[c.field];
            if (c.op === '==') return val === c.value;
            return true;
          });
        }
        if (c.type === 'orderBy') {
          docs.sort((a: any, b: any) => {
            const valA = a.data()[c.field];
            const valB = b.data()[c.field];
            if (c.dir === 'asc') return valA - valB;
            return valB - valA;
          });
        }
        if (c.type === 'limit') {
           docs = docs.slice(0, c.n);
        }
      });
      
      const currentDocs: Record<string, any> = {};
      docs.forEach((d: any) => currentDocs[d.id] = d);
      
      const docChanges: any[] = [];
      
      for (const id in currentDocs) {
        if (!prevDocs[id]) {
          docChanges.push({ type: 'added', doc: currentDocs[id] });
        } else if (JSON.stringify(prevDocs[id].data()) !== JSON.stringify(currentDocs[id].data())) {
          docChanges.push({ type: 'modified', doc: currentDocs[id] });
        }
      }
      
      for (const id in prevDocs) {
        if (!currentDocs[id]) {
          docChanges.push({ type: 'removed', doc: prevDocs[id] });
        }
      }
      
      prevDocs = currentDocs;
      
      cb({
        empty: docs.length === 0,
        docs,
        forEach: (fn: any) => docs.forEach(fn),
        docChanges: () => docChanges
      });
    }
  };
  
  notify();
  
  const listener = () => notify();
  bc.addEventListener('message', listener);
  window.addEventListener('serenity-db-update', listener);
  
  return () => {
    bc.removeEventListener('message', listener);
    window.removeEventListener('serenity-db-update', listener);
  };
};

export const writeBatch = () => {
  const ops: any[] = [];
  return {
    set: (ref: any, data: any) => ops.push({ type: 'set', ref, data }),
    update: (ref: any, data: any) => ops.push({ type: 'update', ref, data }),
    delete: (ref: any) => ops.push({ type: 'delete', ref }),
    commit: async () => {
      const dbData = getDb();
      ops.forEach(op => {
        const pathParts = op.ref.path.split('/');
        const id = pathParts.pop();
        const colPath = pathParts.join('/');
        
        if (op.type === 'set') {
          dbData[op.ref.path] = op.data;
          if (!dbData[colPath]) dbData[colPath] = [];
          if (!dbData[colPath].includes(id)) dbData[colPath].push(id);
        } else if (op.type === 'update') {
          if (dbData[op.ref.path]) {
            dbData[op.ref.path] = { ...dbData[op.ref.path], ...op.data };
          }
        } else if (op.type === 'delete') {
          delete dbData[op.ref.path];
          if (dbData[colPath]) {
            dbData[colPath] = dbData[colPath].filter((x: string) => x !== id);
          }
        }
      });
      saveDb(dbData);
    }
  };
};
