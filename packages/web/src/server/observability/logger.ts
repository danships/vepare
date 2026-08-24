export function logAssetRegistration(event: Record<string, string | number | undefined>): void {
  console.info(JSON.stringify({ event: 'file_asset_registration', ...event }));
}
