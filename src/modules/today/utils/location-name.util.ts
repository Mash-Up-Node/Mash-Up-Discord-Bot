import { GeocodingResult } from '../interfaces/today-api.interface';

export function formatLocationName(location: GeocodingResult): string {
  const parts = [location.name];

  if (location.admin1 && location.admin1 !== location.name) {
    parts.push(location.admin1);
  }

  if (location.country) {
    parts.push(location.country);
  }

  return parts.join(', ');
}
