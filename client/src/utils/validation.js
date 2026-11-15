export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export const isValidEmail = (value) => EMAIL_REGEX.test(String(value || '').trim());

export const isStrongPassword = (value) => PASSWORD_REGEX.test(String(value || ''));

export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}
