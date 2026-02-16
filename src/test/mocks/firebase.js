/**
 * Mock for Firebase services used in testing.
 * Provides mock implementations for analytics, database, and auth.
 */

// Mock analytics
export const mockLogEvent = vi.fn();
export const mockGetAnalytics = vi.fn(() => ({}));

// Mock database
export const mockDbRef = vi.fn(() => ({}));
export const mockDbSet = vi.fn(() => Promise.resolve());
export const mockDbGet = vi.fn(() => Promise.resolve({ exists: () => false, val: () => null }));
export const mockDbPush = vi.fn(() => Promise.resolve({ key: 'mock-key' }));
export const mockDbQuery = vi.fn(() => ({}));
export const mockDbOrderByChild = vi.fn(() => ({}));
export const mockDbLimitToLast = vi.fn(() => ({}));

// Mock auth
export const mockSignInAnonymously = vi.fn(() => Promise.resolve({ user: { uid: 'mock-uid' } }));
export const mockOnAuthStateChanged = vi.fn((auth, cb) => { cb({ uid: 'mock-uid' }); return () => { }; });

// Mock Firebase app
export const mockInitializeApp = vi.fn(() => ({}));

export function resetAllMocks() {
    mockLogEvent.mockClear();
    mockGetAnalytics.mockClear();
    mockDbRef.mockClear();
    mockDbSet.mockClear();
    mockDbGet.mockClear();
    mockDbPush.mockClear();
    mockSignInAnonymously.mockClear();
    mockOnAuthStateChanged.mockClear();
    mockInitializeApp.mockClear();
}
