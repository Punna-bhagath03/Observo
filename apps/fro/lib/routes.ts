export function websiteIncidentsHref(websiteId: string): string {
  return `/website/${websiteId}/incidents`
}

export function websiteMonitoringHref(websiteId: string): string {
  return `/website/${websiteId}/monitoring`
}

export function isIncidentsPath(pathname: string): boolean {
  return pathname === "/incidents" || pathname.endsWith("/incidents")
}

export function isMonitoringPath(pathname: string): boolean {
  return pathname === "/monitoring" || pathname.endsWith("/monitoring")
}
