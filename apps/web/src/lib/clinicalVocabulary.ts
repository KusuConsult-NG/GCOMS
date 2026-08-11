/**
 * The fixed vocabularies the clinical and field screens choose from.
 *
 * All three of these were held as literals inside the pages that used them, and
 * each was wrong in its own way.
 *
 * The cancer categories existed twice. The clinical workspace offered the
 * seventeen the spec calls for; the screening form offered four. So thirteen
 * categories could not be recorded from the screen whose entire purpose is
 * recording a screening — a clinician screening for prostate or colorectal
 * cancer had nowhere to say so. The two lists also wrote different values into
 * the same column: 'Cervical Cancer (VIA / Pap)' from one screen and 'Cervical
 * Cancer' from the other. That is why `calculateRiskScore` matches on a
 * substring and the LGA breakdown matches with `LIKE '%positive%'` — those are
 * defences against a column holding whichever spelling the caller used.
 *
 * The screening results were similarly free-form, and every positive-case count
 * in the system finds them by substring for the same reason.
 *
 * The seventeen LGAs were three identical copies, which is the least harmful
 * kind of duplication and the easiest to break: the field is mandatory on both
 * patient intake and the volunteer register, and the LGA breakdown groups on it,
 * so one copy drifting would quietly split a district into two rows.
 *
 * `clinicalVocabulary.test.ts` reads the API's own constants and asserts these
 * match, because the API now validates writes against them — a value this file
 * offers and the API rejects is a form that fails on submit.
 */

/** CANCER_TYPES in the API's auth/roles.constants.ts. */
export const CANCER_TYPES = [
  'Cervical Cancer (VIA / Pap)',
  'Breast Cancer (CBE / Mammogram)',
  'Prostate Cancer (PSA)',
  'Colorectal Cancer',
  'Lung & Thoracic Cancer',
  'Ovarian & Gynecologic Cancer',
  'Liver & Hepatobiliary Cancer',
  'Pancreatic Cancer',
  'Skin & Melanoma',
  'Leukemia & Lymphoma (Blood Cancers)',
  'Pediatric & Childhood Cancers',
  'Head & Neck Cancers',
  'Brain & CNS Tumors',
  'Thyroid & Endocrine Cancers',
  'Renal / Kidney Cancers',
  'Bladder & Urologic Cancers',
  'Testicular Cancer',
] as const;

/** SCREENING_RESULTS in the API's auth/roles.constants.ts. */
export const SCREENING_RESULTS = [
  'Negative',
  'Suspicious',
  'Positive (VIA+)',
  'Positive (Stage 1)',
  'Positive (Stage 2)',
] as const;

/** What each result means to the person filling the form in. */
export const SCREENING_RESULT_LABEL: Record<string, string> = {
  Negative: 'Negative (Normal)',
  Suspicious: 'Suspicious (Requires Biopsy)',
  'Positive (VIA+)': 'Positive (VIA+)',
  'Positive (Stage 1)': 'Positive (Stage 1)',
  'Positive (Stage 2)': 'Positive (Stage 2)',
};

/** PLATEAU_LGAS in the API's auth/roles.constants.ts. */
export const PLATEAU_LGAS = [
  'Barkin Ladi LGA',
  'Bassa LGA',
  'Bokkos LGA',
  'Jos East LGA',
  'Jos North LGA',
  'Jos South LGA',
  'Kanam LGA',
  'Kanke LGA',
  'Langtang North LGA',
  'Langtang South LGA',
  'Mangu LGA',
  'Mikang LGA',
  'Pankshin LGA',
  "Quan'Pan LGA",
  'Riyom LGA',
  'Shendam LGA',
  'Wase LGA',
] as const;

/** The default the intake and volunteer forms open on. */
export const DEFAULT_LGA = PLATEAU_LGAS[0];
