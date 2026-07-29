const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

if (!PROJECT_ID || !API_KEY) {
  console.warn('Firebase project ID or API key not configured');
}

function docToObj(doc: any): any {
  const fields = doc.fields || {};
  const obj: any = { id: doc.name?.split('/').pop() };
  for (const [key, val] of Object.entries(fields)) {
    obj[key] = valueToNative(val as any);
  }
  return obj;
}

function valueToNative(val: any): any {
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
  if (val.doubleValue !== undefined) return parseFloat(val.doubleValue);
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.timestampValue !== undefined) return val.timestampValue;
  if (val.nullValue !== undefined) return null;
  if (val.arrayValue?.values) return val.arrayValue.values.map(valueToNative);
  if (val.mapValue?.fields) {
    const obj: any = {};
    for (const [k, v] of Object.entries(val.mapValue.fields)) {
      obj[k] = valueToNative(v as any);
    }
    return obj;
  }
  return null;
}

function objToFields(obj: any): any {
  const fields: any = {};
  for (const [key, val] of Object.entries(obj)) {
    fields[key] = nativeToValue(val);
  }
  return fields;
}

function nativeToValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: val.toString() };
    return { doubleValue: val };
  }
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(nativeToValue) } };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (typeof val === 'object') return { mapValue: { fields: objToFields(val) } };
  return { stringValue: String(val) };
}

async function firestoreFetch(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${BASE}/${path}?key=${API_KEY}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Firestore API error ${res.status}: ${errBody}`);
  }

  return res.json();
}

export async function getCollection(collection: string): Promise<any[]> {
  const data = await firestoreFetch(collection + '?orderBy=createdAt%20desc');
  return (data.documents || []).map(docToObj);
}

export async function getCollectionWhere(collection: string, field: string, op: string, value: any): Promise<any[]> {
  const structuredQuery = {
    from: [{ collectionId: collection }],
    where: {
      fieldFilter: {
        field: { fieldPath: field },
        op: op,
        value: nativeToValue(value),
      },
    },
    orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
  };

  const data = await firestoreFetch(':runQuery', {
    method: 'POST',
    body: JSON.stringify({ structuredQuery }),
  });

  return (data || [])
    .filter((r: any) => r.document)
    .map((r: any) => docToObj(r.document));
}

export async function getDoc(collection: string, id: string): Promise<any | null> {
  try {
    const data = await firestoreFetch(`${collection}/${id}`);
    return docToObj(data);
  } catch {
    return null;
  }
}

export async function addDoc(collection: string, data: any): Promise<string> {
  // Use a generated ID: auto-create with random ID
  const randomId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
  const body: any = { fields: objToFields({ ...data, createdAt: new Date().toISOString() }) };
  await firestoreFetch(`${collection}?documentId=${randomId}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return randomId;
}

export async function updateDoc(collection: string, id: string, data: any): Promise<void> {
  const updateMask = Object.keys(data).map(k => `updateMask.fieldPaths=${k}`).join('&');
  const body: any = { fields: objToFields({ ...data, updatedAt: new Date().toISOString() }) };
  await firestoreFetch(`${collection}/${id}?${updateMask}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteDoc(collection: string, id: string): Promise<void> {
  await firestoreFetch(`${collection}/${id}`, { method: 'DELETE' });
}
