/** Development fixtures (used only when MOCK_DATA=1, e.g. for offline screenshots). */
const J = ['Fractal and Fractional', 'Chaos, Solitons & Fractals', 'Mathematics', 'Alexandria Engineering Journal', 'Journal of Applied Analysis & Computation', 'Symmetry']
const T = [
  'A novel expansion iterative method for solving linear partial differential equations of fractional order',
  'Solution of fractional Bratu-type equations by the residual power series method',
  'Laplace residual power series method for solving nonlinear time-fractional PDEs',
  'Analytical solutions of fuzzy fractional differential equations of Caputo type',
  'Approximate solutions of systems of fractional integro-differential equations',
  'New results on fractional power series: theories and applications',
  'A new attractive analytic approach for solutions of linear and nonlinear neutral fractional pantograph equations',
]
export const mockPubs = Array.from({ length: 31 }, (_, i) => ({
  id: 'p' + i,
  title_en: T[i % T.length],
  authors: 'A. El-Ajou, M. Al-Smadi, O. Abu Arqub, S. Momani',
  journal_name: J[i % J.length],
  year: 2023 - Math.floor(i / 2.4),
  volume: String(10 + (i % 30)),
  issue: String(1 + (i % 6)),
  pages: `${100 + i * 7}–${118 + i * 7}`,
  abstract_en: 'In this paper, we construct analytic-approximate solutions using the residual power series technique, prove convergence, and illustrate the efficiency with numerical examples and graphical comparisons.',
  doi: `10.3390/fractalfract${i}0${i}`,
  scholar_url: null,
  journal_url: null,
  citation_count: Math.max(0, 140 - i * 5),
  pub_type: i % 9 === 4 ? 'conference' : 'article',
  is_featured: i < 2,
  created_at: '2024-01-01',
}))
export const mockInterests = ['Fractional Calculus', 'Fractional Differential Equations', 'Mathematical Modelling', 'Numerical Analysis', 'Special Functions', 'Fuzzy Differential Equations'].map((n, i) => ({ id: 'i' + i, name_en: n, name_ar: null, sort_order: i }))
export const mockCourses = [
  { id: 'c1', slug: 'math-371', code: 'MATH 371', name_en: 'Methods of Applied Mathematics', name_ar: 'طرق الرياضيات التطبيقية', description_en: 'Matrix methods for linear systems, eigenvalue methods, Cauchy–Euler systems and nonhomogeneous systems.', description_ar: null, semester: 'First semester', academic_year: '2026/2027', accent: '#1F5FAD', enrollment_open: true },
  { id: 'c2', slug: 'math-241', code: 'MATH 241', name_en: 'Ordinary Differential Equations', name_ar: 'المعادلات التفاضلية العادية', description_en: 'First and second order equations, Laplace transform, series solutions.', description_ar: null, semester: 'First semester', academic_year: '2026/2027', accent: '#0E7C6B', enrollment_open: true },
  { id: 'c3', slug: 'math-701', code: 'MATH 701', name_en: 'Fractional Calculus (Graduate)', name_ar: 'التفاضل الكسري', description_en: 'Riemann–Liouville and Caputo operators, Mittag-Leffler functions, fractional power series.', description_ar: null, semester: 'Second semester', academic_year: '2026/2027', accent: '#7D3C98', enrollment_open: true },
]
