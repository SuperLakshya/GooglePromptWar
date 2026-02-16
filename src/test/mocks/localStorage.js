/**
 * Mock for localStorage used in testing.
 */
class MockLocalStorage {
    constructor() {
        this.store = {};
    }
    getItem(key) {
        return this.store[key] ?? null;
    }
    setItem(key, value) {
        this.store[key] = String(value);
    }
    removeItem(key) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
    }
    get length() {
        return Object.keys(this.store).length;
    }
    key(index) {
        return Object.keys(this.store)[index] ?? null;
    }
}

export function createMockLocalStorage() {
    const mock = new MockLocalStorage();
    Object.defineProperty(globalThis, 'localStorage', { value: mock, writable: true, configurable: true });
    return mock;
}
