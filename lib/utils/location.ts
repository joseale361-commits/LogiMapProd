/**
 * Utility functions for converting location codes to readable names
 */

// Colombian departments with their 2-letter ISO codes
export const COLOMBIAN_DEPARTMENTS: Record<string, string> = {
    'AM': 'Amazonas',
    'AN': 'Antioquia',
    'AR': 'Arauca',
    'AT': 'Atlántico',
    'BO': 'Bolívar',
    'BY': 'Boyacá',
    'CL': 'Caldas',
    'CA': 'Caquetá',
    'CU': 'Cauca',
    'CE': 'Cesar',
    'CH': 'Chocó',
    'CO': 'Córdoba',
    'CI': 'Cundinamarca',
    'GU': 'Guainía',
    'GV': 'Guaviare',
    'HU': 'Huila',
    'LG': 'La Guajira',
    'MA': 'Magdalena',
    'ME': 'Meta',
    'NA': 'Nariño',
    'NS': 'Norte de Santander',
    'PU': 'Putumayo',
    'QC': 'Quindío',
    'RI': 'Risaralda',
    'SA': 'San Andrés y Providencia',
    'SN': 'Santander',
    'SU': 'Sucre',
    'TC': 'Tolima',
    'VC': 'Valle del Cauca',
    'VA': 'Vaupés',
    'VI': 'Vichada',
};

/**
 * Calculate the distance between two points using the Haversine formula
 * @param lat1 - Latitude of point 1 in degrees
 * @param lng1 - Longitude of point 1 in degrees
 * @param lat2 - Latitude of point 2 in degrees
 * @param lng2 - Longitude of point 2 in degrees
 * @returns Distance in kilometers
 */
export function haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // Earth's radius in kilometers

    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Parse PostGIS POINT format to get lat/lng
 * @param point - PostGIS POINT format string (e.g., "POINT(-74.006 4.7)")
 * @returns Object with lat and lng, or null if parsing fails
 */
export function parsePostGISPoint(point: string | null | undefined): { lat: number; lng: number } | null {
    if (!point) return null;

    // PostGIS POINT format: POINT(lng lat)
    const match = point.match(/POINT\s*\(?\s*([-\d.]+)\s+([-\d.]+)\s*\)?/);
    if (!match) return null;

    const lng = parseFloat(match[1]);
    const lat = parseFloat(match[2]);

    if (isNaN(lng) || isNaN(lat)) return null;

    return { lat, lng };
}

// Countries with their 2-letter ISO codes
export const COUNTRIES: Record<string, string> = {
    'CO': 'Colombia',
    'AR': 'Argentina',
    'BO': 'Bolivia',
    'BR': 'Brasil',
    'CL': 'Chile',
    'CR': 'Costa Rica',
    'CU': 'Cuba',
    'DO': 'República Dominicana',
    'EC': 'Ecuador',
    'SV': 'El Salvador',
    'GT': 'Guatemala',
    'HN': 'Honduras',
    'MX': 'México',
    'NI': 'Nicaragua',
    'PA': 'Panamá',
    'PY': 'Paraguay',
    'PE': 'Perú',
    'PR': 'Puerto Rico',
    'US': 'Estados Unidos',
    'UY': 'Uruguay',
    'VE': 'Venezuela',
};

/**
 * Convert a 2-letter state code to its full name
 * @param code - The 2-letter state code
 * @returns The full state name, or the code if not found
 */
export function getStateName(code: string): string {
    return COLOMBIAN_DEPARTMENTS[code] || code;
}

/**
 * Convert a 2-letter country code to its full name
 * @param code - The 2-letter country code
 * @returns The full country name, or the code if not found
 */
export function getCountryName(code: string): string {
    return COUNTRIES[code] || code;
}

/**
 * Get an array of Colombian departments for dropdowns
 * @returns Array of objects with code and name
 */
export function getColombianDepartments() {
    return Object.entries(COLOMBIAN_DEPARTMENTS).map(([code, name]) => ({
        code,
        name,
    }));
}

/**
 * Get an array of countries for dropdowns
 * @returns Array of objects with code and name
 */
export function getCountries() {
    return Object.entries(COUNTRIES).map(([code, name]) => ({
        code,
        name,
    }));
}
