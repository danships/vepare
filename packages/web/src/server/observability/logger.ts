export function logAssetRegistration(event: Record<string, string | number | undefined>): void {
  console.info(JSON.stringify({ event: 'file_asset_registration', ...event }));
}
export function logProjectMediaEvent(event: Record<string, string | number | undefined>): void {
  console.info(JSON.stringify({ event: 'project_media', actor: 'browser-session', ...event }));
}
