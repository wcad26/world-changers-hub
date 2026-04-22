// Backwards-compatible re-export. The actual implementation lives in
// src/contexts/AuthContext.tsx so the entire app shares ONE auth listener
// and ONE user-data fetch pipeline.
export { useAuth } from '@/contexts/AuthContext';
