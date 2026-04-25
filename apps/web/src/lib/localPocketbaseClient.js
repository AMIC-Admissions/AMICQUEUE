const DB_KEY = 'amicqueue.localDb.v1';
const AUTH_KEY = 'amicqueue.localAuth.v1';

const serviceNames = [
  'Inquiry',
  'Complaint',
  'Suggestion',
  'New Registration',
  'Full-Year Fee Payment',
  'Instalment Payment',
  'Book Collection',
  'Uniform Purchase',
  'Uniform Collection',
  'Leave Request',
  'Document Submission',
  'Student File Update',
];

const copy = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

function stripPrivate(record) {
  const result = copy(record);
  delete result._password;
  delete result.password;
  delete result.passwordConfirm;
  return result;
}

function seed() {
  const timestamp = now();
  return {
    tickets: [],
    activity_logs: [],
    messages: [],
    users: [
      {
        id: 'user_admin',
        email: 'admin@amic.com',
        username: 'admin',
        name: 'AMIC Admin',
        role: 'admin',
        counter: 1,
        counterNumber: 1,
        status: 'active',
        verified: true,
        _password: 'admin123',
        created: timestamp,
        updated: timestamp,
      },
      ...Array.from({ length: 10 }, (_, index) => {
        const counter = index + 1;
        return {
          id: `user_counter_${counter}`,
          email: `counter${counter}@amic.com`,
          username: `counter${counter}`,
          name: `Counter ${counter}`,
          role: 'staff',
          counter,
          counterNumber: counter,
          status: 'active',
          verified: true,
          _password: 'counter123',
          created: timestamp,
          updated: timestamp,
        };
      }),
    ],
    counters: Array.from({ length: 10 }, (_, index) => ({
      id: `counter_${index + 1}`,
      name: `Counter ${index + 1}`,
      counterNumber: index + 1,
      status: 'active',
      isActive: true,
      created: timestamp,
      updated: timestamp,
    })),
    services: serviceNames.map((name, index) => ({
      id: `service_${index + 1}`,
      name,
      nameAr: name,
      order: index + 1,
      isActive: true,
      created: timestamp,
      updated: timestamp,
    })),
    settings: [{
      id: 'settings_default',
      systemTitle: 'Admissions & Registration Office',
      systemSubtitle: 'Queue Management System',
      colorBackground: 'light',
      notificationSettings: { soundEnabled: true, autoLogout: 30, defaultLanguage: 'en' },
      services: serviceNames,
      branches: ['AMIS', 'KIDS'],
      created: timestamp,
      updated: timestamp,
    }],
  };
}

function read(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function value(raw) {
  const text = raw.trim();
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) return text.slice(1, -1);
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (text === 'null') return null;
  return Number.isNaN(Number(text)) ? text : Number(text);
}

function splitFilter(filter, separator) {
  const parts = [];
  let current = '';
  let quote = '';
  for (let index = 0; index < filter.length; index += 1) {
    const char = filter[index];
    if ((char === '"' || char === "'") && filter[index - 1] !== '\\') quote = quote === char ? '' : char;
    if (!quote && filter.slice(index, index + separator.length) === separator) {
      parts.push(current.trim());
      current = '';
      index += separator.length - 1;
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function compare(record, expression) {
  const match = expression.match(/^([\w.]+)\s*(>=|<=|!=|=|>|<)\s*(.+)$/);
  if (!match) return true;
  const [, field, operator, rawExpected] = match;
  const actual = record[field];
  const expected = value(rawExpected);
  const left = typeof expected === 'string' && /^\d{4}-\d{2}-\d{2}/.test(expected) ? new Date(actual).getTime() : actual;
  const right = typeof expected === 'string' && /^\d{4}-\d{2}-\d{2}/.test(expected) ? new Date(expected).getTime() : expected;
  if (operator === '=') return String(actual) === String(expected);
  if (operator === '!=') return String(actual) !== String(expected);
  if (operator === '>=') return left >= right;
  if (operator === '<=') return left <= right;
  if (operator === '>') return left > right;
  if (operator === '<') return left < right;
  return true;
}

function matches(record, filter) {
  if (!filter) return true;
  return splitFilter(filter, '||').some((group) => splitFilter(group, '&&').every((part) => compare(record, part)));
}

function sortValue(record, field) {
  const valueForField = record[field];
  const parsedDate = typeof valueForField === 'string' ? new Date(valueForField).getTime() : NaN;
  return Number.isNaN(parsedDate) ? valueForField ?? '' : parsedDate;
}

function query(records, options = {}) {
  const fields = String(options.sort || '').split(',').map((item) => item.trim()).filter(Boolean);
  return records.filter((record) => matches(record, options.filter)).sort((a, b) => {
    for (const fieldName of fields) {
      const desc = fieldName.startsWith('-');
      const key = desc ? fieldName.slice(1) : fieldName;
      const left = sortValue(a, key);
      const right = sortValue(b, key);
      if (left < right) return desc ? 1 : -1;
      if (left > right) return desc ? -1 : 1;
    }
    return 0;
  }).map(stripPrivate);
}

class LocalAuthStore {
  constructor() {
    this.listeners = new Set();
    this.state = read(AUTH_KEY, { token: '', model: null });
  }
  get token() { return this.state.token; }
  get model() { return this.state.model; }
  get isValid() { return Boolean(this.token && this.model?.id); }
  onChange(callback) { this.listeners.add(callback); return () => this.listeners.delete(callback); }
  set(record) { this.state = { token: `local_${record.id}`, model: stripPrivate(record) }; write(AUTH_KEY, this.state); this.emit(); }
  clear() { this.state = { token: '', model: null }; write(AUTH_KEY, this.state); this.emit(); }
  emit() { this.listeners.forEach((callback) => callback(this.token, this.model)); }
}

class LocalCollection {
  constructor(client, name) {
    this.client = client;
    this.name = name;
  }
  list() {
    this.client.db[this.name] ||= [];
    return this.client.db[this.name];
  }
  async getFullList(first = {}, second = {}) {
    return query(this.list(), typeof first === 'object' ? first : second);
  }
  async getList(page = 1, perPage = 30, options = {}) {
    const items = query(this.list(), options);
    return { page, perPage, totalItems: items.length, totalPages: Math.max(1, Math.ceil(items.length / perPage)), items: items.slice((page - 1) * perPage, page * perPage) };
  }
  async getOne(recordId) {
    const record = this.list().find((item) => item.id === recordId);
    if (!record) throw new Error(`${this.name} record not found`);
    return stripPrivate(record);
  }
  async getFirstListItem(filter = '', options = {}) {
    const [record] = query(this.list(), { ...options, filter });
    if (!record) throw new Error(`${this.name} record not found`);
    return record;
  }
  async create(data = {}) {
    const timestamp = now();
    const record = { ...copy(data), id: data.id || id(this.name), created: data.created || data.createdAt || timestamp, createdAt: data.createdAt || data.created || timestamp, updated: timestamp, updatedAt: timestamp };
    if (this.name === 'users') record._password = data.password || data._password || 'changeme123';
    if (this.name === 'tickets') {
      record.status ||= 'Pending';
      record.counter = record.counter ?? record.counterNumber ?? null;
      record.counterNumber = record.counterNumber ?? record.counter ?? null;
    }
    this.list().push(record);
    this.client.save();
    this.client.notify(this.name, 'create', record);
    return stripPrivate(record);
  }
  async update(recordId, data = {}) {
    const records = this.list();
    const index = records.findIndex((item) => item.id === recordId);
    if (index === -1) throw new Error(`${this.name} record not found`);
    records[index] = { ...records[index], ...copy(data), updated: now(), updatedAt: now() };
    if (this.name === 'users' && data.password) records[index]._password = data.password;
    this.client.save();
    this.client.notify(this.name, 'update', records[index]);
    return stripPrivate(records[index]);
  }
  async delete(recordId) {
    const index = this.list().findIndex((item) => item.id === recordId);
    if (index === -1) throw new Error(`${this.name} record not found`);
    const [record] = this.list().splice(index, 1);
    this.client.save();
    this.client.notify(this.name, 'delete', record);
    return true;
  }
  async authWithPassword(identity, password) {
    const login = String(identity).trim().toLowerCase();
    const user = this.list().find((item) => [item.email, item.username].filter(Boolean).some((entry) => String(entry).toLowerCase() === login));
    if (!user || user._password !== password) throw new Error('Invalid email or password');
    this.client.authStore.set(user);
    return { token: this.client.authStore.token, record: stripPrivate(user) };
  }
  async subscribe(topic, callback) { this.client.subscribe(this.name, topic, callback); }
  async unsubscribe(topic = '*') { this.client.unsubscribe(this.name, topic); }
}

export function createLocalPocketbaseClient() {
  return new class LocalPocketbaseClient {
    constructor() {
      this.db = read(DB_KEY, null) || seed();
      this.listeners = new Map();
      this.authStore = new LocalAuthStore();
      this.realtime = { isConnected: true };
      this.files = { getUrl: () => null };
      this.save();
    }
    autoCancellation() {}
    collection(name) { return new LocalCollection(this, name); }
    save() { write(DB_KEY, this.db); }
    subscribe(collection, topic, callback) {
      const key = `${collection}:${topic}`;
      if (!this.listeners.has(key)) this.listeners.set(key, new Set());
      this.listeners.get(key).add(callback);
    }
    unsubscribe(collection, topic = '*') {
      this.listeners.delete(`${collection}:${topic}`);
      if (topic === '*') this.listeners.delete(`${collection}:*`);
    }
    notify(collection, action, record) {
      [...(this.listeners.get(`${collection}:*`) || [])].forEach((callback) => setTimeout(() => callback({ action, record: stripPrivate(record) }), 0));
    }
  }();
}
