export interface Profile {
  id: string
  name_ar: string | null
  name_en: string
  title_ar: string | null
  title_en: string | null
  degree_ar: string | null
  degree_en: string | null
  university_ar: string | null
  university_en: string | null
  faculty_ar: string | null
  faculty_en: string | null
  department_ar: string | null
  department_en: string | null
  specialization_ar: string | null
  specialization_en: string | null
  bio_ar: string | null
  bio_en: string | null
  email: string | null
  phone: string | null
  office: string | null
  office_hours: string | null
  photo_url: string | null
  cv_url: string | null
  google_scholar_url: string | null
  orcid_url: string | null
  researchgate_url: string | null
  linkedin_url: string | null
  twitter_url: string | null
}

export interface Publication {
  id: string
  title_ar: string | null
  title_en: string
  authors: string
  journal_name: string | null
  year: number
  volume: string | null
  issue: string | null
  pages: string | null
  abstract_en: string | null
  abstract_ar: string | null
  doi: string | null
  pubmed_url: string | null
  scholar_url: string | null
  journal_url: string | null
  pdf_url: string | null
  keywords: string[] | null
  research_area: string | null
  citation_count: number
  pub_type: string
  is_featured: boolean
}

export interface Course {
  id: string
  code: string | null
  name_ar: string | null
  name_en: string
  description_ar: string | null
  description_en: string | null
  level: string
  semester: string | null
  academic_year: string | null
  is_active: boolean
}

export interface CourseMaterial {
  id: string
  course_id: string
  title_ar: string | null
  title_en: string
  description: string | null
  material_type: string | null
  file_url: string | null
  external_url: string | null
  week_number: number | null
  sort_order: number
  is_visible: boolean
}

export interface NewsActivity {
  id: string
  title_ar: string | null
  title_en: string
  content_ar: string | null
  content_en: string | null
  activity_type: string
  activity_date: string | null
  location: string | null
  image_url: string | null
  external_url: string | null
  is_featured: boolean
}

export interface Education {
  id: string
  degree_ar: string | null
  degree_en: string
  field_ar: string | null
  field_en: string | null
  institution_ar: string | null
  institution_en: string
  country: string | null
  year_start: number | null
  year_end: number | null
  thesis_title: string | null
  supervisor: string | null
}

export interface Position {
  id: string
  title_ar: string | null
  title_en: string
  institution_ar: string | null
  institution_en: string | null
  department_ar: string | null
  department_en: string | null
  year_start: number | null
  year_end: number | null
  is_current: boolean
}

export interface Award {
  id: string
  title_ar: string | null
  title_en: string
  organization_ar: string | null
  organization_en: string | null
  year: number | null
  description_ar: string | null
  description_en: string | null
}

export interface ResearchInterest {
  id: string
  name_ar: string | null
  name_en: string
  icon: string | null
  sort_order: number
}

export type Language = 'en' | 'ar'