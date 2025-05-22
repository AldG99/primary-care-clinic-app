// src/utils/dateUtils.js

/**
 * Formatea una fecha para mostrar en formato local
 * @param {Date|string|number} date - Fecha a formatear
 * @param {Object} options - Opciones de formato
 * @returns {string} Fecha formateada
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';

  const dateObj = date instanceof Date ? date : new Date(date);

  // Opciones por defecto
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  // Combinar opciones
  const formatOptions = { ...defaultOptions, ...options };

  return dateObj.toLocaleDateString('es-MX', formatOptions);
};

/**
 * Formatea una fecha con hora para mostrar en formato local
 * @param {Date|string|number} date - Fecha a formatear
 * @returns {string} Fecha y hora formateada
 */
export const formatDateTime = date => {
  if (!date) return '';

  const dateObj = date instanceof Date ? date : new Date(date);

  return dateObj.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Calcula la edad basada en la fecha de nacimiento
 * @param {string} birthDateString - Fecha de nacimiento en formato YYYY-MM-DD
 * @returns {number|string} Edad calculada o cadena vacía si no hay fecha
 */
export const calculateAge = birthDateString => {
  if (!birthDateString) return '';

  const birthDate = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

/**
 * Verifica si una fecha es hoy
 * @param {Date|string|number} date - Fecha a verificar
 * @returns {boolean} true si la fecha es hoy
 */
export const isToday = date => {
  const dateObj = date instanceof Date ? date : new Date(date);
  const today = new Date();

  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
};

/**
 * Obtiene la fecha de inicio de esta semana
 * @returns {Date} Fecha de inicio de la semana (domingo)
 */
export const getStartOfWeek = () => {
  const today = new Date();
  const day = today.getDay(); // 0 (domingo) a 6 (sábado)
  const diff = today.getDate() - day;

  const startOfWeek = new Date(today);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  return startOfWeek;
};

/**
 * Obtiene la fecha de inicio de este mes
 * @returns {Date} Fecha de inicio del mes
 */
export const getStartOfMonth = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
};

/**
 * Obtiene la fecha de inicio de este año
 * @returns {Date} Fecha de inicio del año
 */
export const getStartOfYear = () => {
  const today = new Date();
  return new Date(today.getFullYear(), 0, 1);
};
