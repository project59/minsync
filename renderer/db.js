export class SyncDB {
  constructor(dbName = 'PhoneSync') {
    this.dbName = dbName
    this.db = null
  }

  async open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, 1)
      req.onupgradeneeded = (e) => {
        const db = e.target.result
        if (!db.objectStoreNames.contains('files')) {
          const store = db.createObjectStore('files', { keyPath: 'path' })
          store.createIndex('size_mtime', ['size', 'mtime'], { unique: false })
          store.createIndex('last_seen', 'last_seen', { unique: false })
        }
        if (!db.objectStoreNames.contains('syncs')) {
          db.createObjectStore('syncs', { keyPath: 'id', autoIncrement: true })
        }
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config', { keyPath: 'key' })
        }
      }
      req.onsuccess = (e) => { this.db = e.target.result; resolve() }
      req.onerror = (e) => reject(e.target.error)
    })
  }

  // Files
  async getFile(path) {
    return this._get('files', path)
  }

  async getAllFiles() {
    return this._getAll('files')
  }

  async putFile(file) {
    return this._put('files', file)
  }

  async putFiles(files) {
    const tx = this.db.transaction('files', 'readwrite')
    for (const f of files) tx.objectStore('files').put(f)
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = (e) => reject(e.target.error)
    })
  }

  async findMatchesBySizeMtime(size, mtime) {
    return this._getByIndex('files', 'size_mtime', IDBKeyRange.only([size, mtime]))
  }

  async getUnseenFiles(since) {
    const range = IDBKeyRange.upperBound(since, true)
    const results = await this._getByIndex('files', 'last_seen', range)
    return results.filter(r => r.last_seen !== since)
  }

  // Config
  async getConfig(key) {
    const val = await this._get('config', key)
    return val?.value
  }

  async setConfig(key, value) {
    return this._put('config', { key, value })
  }

  async deleteConfig(key) {
    return new Promise((resolve, reject) => {
      const req = this.db.transaction('config', 'readwrite').objectStore('config').delete(key)
      req.onsuccess = () => resolve()
      req.onerror = (e) => reject(e.target.error)
    })
  }

  // Sync history
  async addSyncRecord(record) {
    return this._put('syncs', { ...record, timestamp: Date.now() })
  }

  async getSyncHistory(limit = 20) {
    const all = await this._getAll('syncs')
    return all.reverse().slice(0, limit)
  }

  // Helpers
  _get(store, key) {
    return new Promise((resolve, reject) => {
      const req = this.db.transaction(store).objectStore(store).get(key)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = (e) => reject(e.target.error)
    })
  }

  _getAll(store) {
    return new Promise((resolve, reject) => {
      const req = this.db.transaction(store).objectStore(store).getAll()
      req.onsuccess = () => resolve(req.result)
      req.onerror = (e) => reject(e.target.error)
    })
  }

  _getByIndex(store, indexName, range) {
    return new Promise((resolve, reject) => {
      const req = this.db.transaction(store).objectStore(store).index(indexName).getAll(range)
      req.onsuccess = () => resolve(req.result)
      req.onerror = (e) => reject(e.target.error)
    })
  }

  _put(store, value) {
    return new Promise((resolve, reject) => {
      const req = this.db.transaction(store, 'readwrite').objectStore(store).put(value)
      req.onsuccess = () => resolve()
      req.onerror = (e) => reject(e.target.error)
    })
  }
}
