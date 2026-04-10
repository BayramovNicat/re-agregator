/**
 * Canonical Baku district names and alias normalization.
 * Azerbaijani listings use many spellings, abbreviations, and Romanizations.
 * This module maps them all to a single standard string.
 */

export enum BakuDistrict {
  NASIMI = 'Nasimi',
  YASAMAL = 'Yasamal',
  NARIMANOV = 'Nərimanov',
  SABUNCHU = 'Sabunçu',
  NIZAMI = 'Nizami',
  BINAGADI = 'Binəqədi',
  KHATAI = 'Xətai',
  SURAKHANI = 'Suraxanı',
  SABAIL = 'Səbail',
  GARADAGH = 'Qaradağ',
  PIRALLAHI = 'Pirallahı',
  ABSHERON = 'Abşeron',
  UNKNOWN = 'Unknown',
}

/** All known aliases mapped to their canonical district value */
const DISTRICT_ALIASES: Record<string, BakuDistrict> = {
  // Nərimanov
  'nərimanov': BakuDistrict.NARIMANOV,
  'nerimanov': BakuDistrict.NARIMANOV,
  'narimanov': BakuDistrict.NARIMANOV,
  'nərimanov r.': BakuDistrict.NARIMANOV,
  'nərimanov ray.': BakuDistrict.NARIMANOV,
  'nərimanov rayonu': BakuDistrict.NARIMANOV,

  // Nasimi
  'nasimi': BakuDistrict.NASIMI,
  'nasimi r.': BakuDistrict.NASIMI,
  'nasimi ray.': BakuDistrict.NASIMI,
  'nasimi rayonu': BakuDistrict.NASIMI,

  // Yasamal
  'yasamal': BakuDistrict.YASAMAL,
  'yasamal r.': BakuDistrict.YASAMAL,
  'yasamal ray.': BakuDistrict.YASAMAL,
  'yasamal rayonu': BakuDistrict.YASAMAL,

  // Sabunçu
  'sabunçu': BakuDistrict.SABUNCHU,
  'sabunchu': BakuDistrict.SABUNCHU,
  'sabuncu': BakuDistrict.SABUNCHU,
  'sabunçu r.': BakuDistrict.SABUNCHU,
  'sabunçu rayonu': BakuDistrict.SABUNCHU,

  // Nizami
  'nizami': BakuDistrict.NIZAMI,
  'nizami r.': BakuDistrict.NIZAMI,
  'nizami ray.': BakuDistrict.NIZAMI,
  'nizami rayonu': BakuDistrict.NIZAMI,

  // Binəqədi
  'binəqədi': BakuDistrict.BINAGADI,
  'binagadi': BakuDistrict.BINAGADI,
  'binaqadi': BakuDistrict.BINAGADI,
  'binəqədi r.': BakuDistrict.BINAGADI,
  'binəqədi rayonu': BakuDistrict.BINAGADI,

  // Xətai
  'xətai': BakuDistrict.KHATAI,
  'khatai': BakuDistrict.KHATAI,
  'xetai': BakuDistrict.KHATAI,
  'xətai r.': BakuDistrict.KHATAI,
  'xətai rayonu': BakuDistrict.KHATAI,

  // Suraxanı
  'suraxanı': BakuDistrict.SURAKHANI,
  'surakhani': BakuDistrict.SURAKHANI,
  'suraxani': BakuDistrict.SURAKHANI,

  // Səbail
  'səbail': BakuDistrict.SABAIL,
  'sabail': BakuDistrict.SABAIL,
  'sebail': BakuDistrict.SABAIL,
  'səbail r.': BakuDistrict.SABAIL,

  // Qaradağ
  'qaradağ': BakuDistrict.GARADAGH,
  'garadagh': BakuDistrict.GARADAGH,
  'qaradag': BakuDistrict.GARADAGH,

  // Pirallahı
  'pirallahı': BakuDistrict.PIRALLAHI,
  'pirallahi': BakuDistrict.PIRALLAHI,

  // Abşeron
  'abşeron': BakuDistrict.ABSHERON,
  'absheron': BakuDistrict.ABSHERON,
  'abseron': BakuDistrict.ABSHERON,
};

/**
 * Normalizes a raw district string scraped from a listing to a canonical BakuDistrict.
 * Strips leading/trailing whitespace and performs case-insensitive lookup.
 * Returns BakuDistrict.UNKNOWN if no alias matches.
 *
 * @example
 * normalizeDistrict("Nərimanov r.")  // → "Nərimanov"
 * normalizeDistrict("narimanov")     // → "Nərimanov"
 * normalizeDistrict("yasamal ray.")  // → "Yasamal"
 */
export function normalizeDistrict(raw: string): BakuDistrict {
  const key = raw.trim().toLowerCase();
  return DISTRICT_ALIASES[key] ?? BakuDistrict.UNKNOWN;
}
