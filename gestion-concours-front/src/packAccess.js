export const PACK_OPTIONS = [
  { value: 'MEDECINE', label: 'Médecine' },
  { value: 'ENSAM', label: 'ENSAM' },
  { value: 'ENSA', label: 'ENSA' },
  { value: 'ENCG', label: 'ENCG' },
  { value: 'MEDECINE_ENSA', label: 'Médecine + ENSA' },
  { value: 'PACK_COMPLET', label: 'Pack Complet' },
];

const PACK_SCHOOLS = {
  MEDECINE: ['MEDECINE'],
  ENSAM: ['ENSAM'],
  ENSA: ['ENSA', 'ENSCK'],
  ENCG: ['ENCG'],
  MEDECINE_ENSA: ['MEDECINE', 'ENSA', 'ENSCK'],
  PACK_COMPLET: ['MEDECINE', 'ENSAM', 'ENSA', 'ENSCK', 'ENCG'],
};

const normalize = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, ' ')
  .trim();

export function readStudentPack() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return PACK_SCHOOLS[user.pack] ? user.pack : 'PACK_COMPLET';
  } catch {
    return 'PACK_COMPLET';
  }
}

export function getSchoolCode(value) {
  const name = normalize(value);
  if (!name) return '';

  const words = new Set(name.split(' '));
  if (words.has('ENSAM')) return 'ENSAM';
  if (words.has('ENSCK')) return 'ENSCK';
  if (words.has('ENCG')) return 'ENCG';
  if (words.has('ENSA')) return 'ENSA';
  if (words.has('FMP') || words.has('FMD') || words.has('MEDECINE') || words.has('PHARMACIE')) return 'MEDECINE';
  return '';
}

export function isSchoolIncluded(school, pack = readStudentPack(), includeUnassigned = false) {
  const code = getSchoolCode(school);
  if (!code) return includeUnassigned;
  return (PACK_SCHOOLS[pack] || PACK_SCHOOLS.PACK_COMPLET).includes(code);
}

export function filterByStudentPack(items, schoolField = 'ecole', includeUnassigned = false) {
  const pack = readStudentPack();
  return (Array.isArray(items) ? items : []).filter((item) =>
    isSchoolIncluded(item?.[schoolField], pack, includeUnassigned)
  );
}
