import { SyllabusSubject } from '../../services/syllabusService';

export const SUBJECT_CATEGORY_ORDER = [
  'PCC', 
  'PEC1', 'PEC2', 'PEC3', 'PEC4', 'PEC5', 'PEC', 
  'OEC', 'OPEN', 'MINOR', 'HONOURS', 'OTHER'
];
export const UNCATEGORIZED_CATEGORY = 'UNCATEGORIZED';

const CATEGORY_ALIASES: Record<string, string> = {
  PCE: 'PEC',
};

export interface SubjectCategoryGroup {
  key: string;
  label: string;
  subjects: SyllabusSubject[];
}

export function normalizeSubjectCategory(category?: string | null): string {
  const trimmed = category?.trim();
  if (!trimmed) return UNCATEGORIZED_CATEGORY;

  const upper = trimmed.toUpperCase();
  return CATEGORY_ALIASES[upper] ?? upper;
}

export function getSubjectCategoryLabel(categoryKey: string): string {
  if (categoryKey === UNCATEGORIZED_CATEGORY) return 'Uncategorized';
  
  // Pretty labels for PECs if they don't already have them
  if (categoryKey.startsWith('PEC') && categoryKey.length > 3) {
    const num = categoryKey.substring(3);
    if (!isNaN(parseInt(num))) {
      return `Program Elective ${num}`;
    }
  }
  
  if (categoryKey === 'PEC') return 'Program Elective';
  if (categoryKey === 'PCC') return 'Program Core';
  if (categoryKey === 'OEC') return 'Open Elective';
  
  return categoryKey;
}

export function groupSubjectsByCategory(subjects: SyllabusSubject[]): SubjectCategoryGroup[] {
  const groups = new Map<string, SyllabusSubject[]>();

  subjects.forEach((subject) => {
    let key = normalizeSubjectCategory(subject.category);
    
    // Use program_elective if available for PEC/OEC to sub-categorize
    if (subject.program_elective && (key === 'PEC' || key === 'OEC' || key.startsWith('PEC'))) {
      const electiveKey = subject.program_elective.trim().toUpperCase();
      if (electiveKey) {
        key = electiveKey;
      }
    }
    
    const current = groups.get(key) ?? [];
    current.push(subject);
    groups.set(key, current);
  });

  const rankFor = (key: string) => {
    if (key === UNCATEGORIZED_CATEGORY) return SUBJECT_CATEGORY_ORDER.length + 1;
    
    // Find index in order
    const index = SUBJECT_CATEGORY_ORDER.indexOf(key);
    if (index >= 0) return index;
    
    // Handle dynamic PEC labels (PEC1, PEC2 etc if not in order array)
    if (key.startsWith('PEC')) {
      const num = parseInt(key.substring(3));
      if (!isNaN(num)) return 1 + (num * 0.1); // Sort PECs after PCC but before others
    }

    return SUBJECT_CATEGORY_ORDER.length;
  };

  return Array.from(groups.entries())
    .map(([key, groupSubjects]) => ({
      key,
      label: getSubjectCategoryLabel(key),
      subjects: groupSubjects,
    }))
    .sort((a, b) => {
      const rankA = rankFor(a.key);
      const rankB = rankFor(b.key);
      const rankDiff = rankA - rankB;
      
      if (rankDiff !== 0) return rankDiff;
      return a.label.localeCompare(b.label);
    });
}