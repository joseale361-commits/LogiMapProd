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
