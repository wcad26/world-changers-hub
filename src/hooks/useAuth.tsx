// Compatibility shim: stale browser/dev-server module caches may still
// request `/src/hooks/useAuth.tsx`. Re-export the real hook so those
// requests resolve cleanly instead of blanking the app.
export { useAuth } from './useAuth';
