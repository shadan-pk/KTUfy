import { SyllabusSubject } from '../../services/syllabusService';

export const SUBJECT_CATEGORY_ORDER = ['PCC', 'PEC', 'OEC', 'OPEN', 'MINOR', 'HONOURS', 'OTHER'];
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
  return categoryKey;
}

export function groupSubjectsByCategory(subjects: SyllabusSubject[]): SubjectCategoryGroup[] {
  const groups = new Map<string, SyllabusSubject[]>();

  subjects.forEach((subject) => {
    const key = normalizeSubjectCategory(subject.category);
    const current = groups.get(key) ?? [];
    current.push(subject);
    groups.set(key, current);
  });

  const rankFor = (key: string) => {
    if (key === UNCATEGORIZED_CATEGORY) return SUBJECT_CATEGORY_ORDER.length + 1;
    const index = SUBJECT_CATEGORY_ORDER.indexOf(key);
    return index >= 0 ? index : SUBJECT_CATEGORY_ORDER.length;
  };

  return Array.from(groups.entries())
    .map(([key, groupSubjects]) => ({
      key,
      label: getSubjectCategoryLabel(key),
      subjects: groupSubjects,
    }))
    .sort((a, b) => {
      const rankDiff = rankFor(a.key) - rankFor(b.key);
      if (rankDiff !== 0) return rankDiff;
      return a.label.localeCompare(b.label);
    });
}