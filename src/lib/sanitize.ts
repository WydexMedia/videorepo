/**
 * Sanitization utilities for user input
 */

const removeHTML = (input: string | null | undefined): string => {
  if (!input || typeof input !== 'string') {
    return input || '';
  }
  return input.replace(/<[^>]*>/g, '');
};

const removeScripts = (input: string | null | undefined): string => {
  if (!input || typeof input !== 'string') {
    return input || '';
  }
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  return sanitized;
};

const sanitizeText = (input: string | null | undefined): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  let sanitized = input.trim();
  sanitized = removeHTML(sanitized);
  sanitized = removeScripts(sanitized);
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  sanitized = sanitized.replace(/\s+/g, ' ');
  return sanitized.trim();
};

const isValidEmailFormat = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizeEmail = (email: string | null | undefined): string => {
  if (!email || typeof email !== 'string') {
    return '';
  }
  let sanitized = removeHTML(email);
  sanitized = removeScripts(sanitized);
  sanitized = sanitized.trim().toLowerCase();
  sanitized = sanitized.replace(/[<>'"&]/g, '');
  sanitized = sanitized.replace(/\s+/g, '');
  if (!isValidEmailFormat(sanitized)) {
    return '';
  }
  return sanitized;
};

export const sanitizeName = (name: string | null | undefined): string => {
  if (!name || typeof name !== 'string') {
    return '';
  }
  let sanitized = sanitizeText(name);
  sanitized = sanitized.replace(/[^a-zA-Z\s\-'\.]/g, '');
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  return sanitized;
};

export const sanitizePlace = (place: string | null | undefined): string => {
  if (!place || typeof place !== 'string') {
    return '';
  }
  let sanitized = sanitizeText(place);
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-,\.]/g, '');
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  return sanitized;
};

const SAFE_PROFILE_FIELDS = ['firstName', 'lastName', 'email', 'place', 'avatar'];
const SAFE_PREFERENCES_FIELDS = ['language', 'notifications'];

export const safeProfile = (profile: unknown): Record<string, unknown> => {
  if (!profile || typeof profile !== 'object') {
    return {};
  }
  const safe: Record<string, unknown> = {};
  const profileObj = profile as Record<string, unknown>;
  for (const field of SAFE_PROFILE_FIELDS) {
    if (profileObj.hasOwnProperty(field) && profileObj[field] !== undefined) {
      safe[field] = profileObj[field];
    }
  }
  return safe;
};

export const safePreferences = (preferences: unknown): Record<string, unknown> => {
  if (!preferences || typeof preferences !== 'object') {
    return {};
  }
  const safe: Record<string, unknown> = {};
  const preferencesObj = preferences as Record<string, unknown>;
  for (const field of SAFE_PREFERENCES_FIELDS) {
    if (preferencesObj.hasOwnProperty(field) && preferencesObj[field] !== undefined) {
      safe[field] = preferencesObj[field];
    }
  }
  return safe;
};

export const escapeHtml = (input: string | null | undefined): string => {
  if (input === null || input === undefined) {
    return '';
  }
  if (typeof input !== 'string') {
    input = String(input);
  }
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return input.replace(/[&<>"'\/]/g, (char) => htmlEscapes[char] || char);
};

export const escapeString = (input: string | null | undefined): string => {
  if (!input || typeof input !== 'string') {
    return input || '';
  }
  return escapeHtml(input);
};

const escapeProfile = (profile: unknown): Record<string, unknown> => {
  if (!profile || typeof profile !== 'object') {
    return {};
  }
  const escaped: Record<string, unknown> = {};
  const profileObj = profile as Record<string, unknown>;
  for (const field of SAFE_PROFILE_FIELDS) {
    if (profileObj.hasOwnProperty(field) && profileObj[field] !== undefined) {
      const value = profileObj[field];
      if (typeof value === 'string') {
        escaped[field] = escapeString(value);
      } else {
        escaped[field] = value;
      }
    }
  }
  return escaped;
};

export const safeProfileForOutput = (profile: unknown): Record<string, unknown> => {
  const filtered = safeProfile(profile);
  return escapeProfile(filtered);
};

export const escapeRegex = (input: string | null | undefined): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  return input.replace(/[.*+?^${}()[\]\\]/g, '\\$&');
};

