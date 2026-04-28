export const BRANCH_OPTIONS = [
  {
    value: 'AMIS',
    slug: 'ajyal',
    label: 'Ajyal',
    labelAr: '\u0623\u062c\u064a\u0627\u0644',
  },
  {
    value: 'KIDS',
    slug: 'kids-gate',
    label: 'Kids Gate',
    labelAr: '\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u0637\u0641\u0644',
  },
];

const BRANCH_ALIASES = {
  AMIS: 'AMIS',
  AJYAL: 'AMIS',
  AJIAL: 'AMIS',
  '\u0623\u062c\u064a\u0627\u0644': 'AMIS',
  KIDS: 'KIDS',
  KIDSGATE: 'KIDS',
  'KIDS GATE': 'KIDS',
  '\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u0637\u0641\u0644': 'KIDS',
};

export const normalizeBranch = (value, fallback = 'AMIS') => {
  const raw = String(value || '').trim();
  if (!raw) return fallback;

  const compact = raw.toUpperCase().replace(/[_-]/g, '').replace(/\s+/g, ' ');
  return BRANCH_ALIASES[compact] || BRANCH_ALIASES[raw] || fallback;
};

export const getBranchMeta = (value) => {
  const normalized = normalizeBranch(value);
  return BRANCH_OPTIONS.find((branch) => branch.value === normalized) || BRANCH_OPTIONS[0];
};

export const getBranchLabel = (value, language = 'en') => {
  const branch = getBranchMeta(value);
  return language === 'ar' ? branch.labelAr : branch.label;
};

export const getBranchSlug = (value) => getBranchMeta(value).slug;

export const getBranchValues = () => BRANCH_OPTIONS.map((branch) => branch.value);
