// Device ID & LocalStorage Tracking Management
// No login, no password, no accounts anywhere.
const DEVICE_ID_KEY = 'civicpulse_device_id';
const MY_REPORTS_KEY = 'civicpulse_my_reports';

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server_render_id';

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function saveMyReport(trackingId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getMyReportIds();
    const cleanId = trackingId.toUpperCase().trim();
    if (!existing.includes(cleanId)) {
      const updated = [cleanId, ...existing].slice(0, 50);
      localStorage.setItem(MY_REPORTS_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.error('Error saving tracking ID to local storage:', err);
  }
}

export function getMyReportIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MY_REPORTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function isMyReport(trackingId: string): boolean {
  const ids = getMyReportIds();
  return ids.includes(trackingId.toUpperCase().trim());
}
