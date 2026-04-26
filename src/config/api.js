const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const AUTH_URL    = `${API_URL}/api/v1/auth`;
export const COURSE_URL  = `${API_URL}/api/v1/courses`;
export const SECTION_URL = `${API_URL}/api/v1/sections`;
export const VIDEO_URL   = `${API_URL}/api/v1/videos`;
export const ENROLLMENT_URL  = `${API_URL}/api/v1/enrollments`;
export const PAYMENT_URL     = `${API_URL}/api/v1/payments`;
export const LIVECLASS_URL   = `${API_URL}/api/v1/liveclasses`;
export const ASSESSMENT_URL  = `${API_URL}/api/v1/assessments`;
export const DISCUSSION_URL  = `${API_URL}/api/v1/discussions`;
export const CONTACT_URL = `${API_URL}/api/v1/contacts`;
export const RESOURCE_URL = `${API_URL}/api/v1/resources`;

export default API_URL;