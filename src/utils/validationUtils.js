// src/utils/validationUtils.js

/**
 * Valida un correo electrónico
 * @param {string} email - Correo electrónico a validar
 * @returns {boolean} true si es válido
 */
export const isValidEmail = email => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida un número de teléfono
 * @param {string} phone - Número a validar
 * @returns {boolean} true si es válido
 */
export const isValidPhone = phone => {
  if (!phone) return false;
  // Formato básico (ajustar según necesidades)
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Valida una fecha en formato YYYY-MM-DD
 * @param {string} dateString - Fecha a validar
 * @returns {boolean} true si es válida
 */
export const isValidDate = dateString => {
  if (!dateString) return false;

  // Verificar formato
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;

  // Verificar fecha válida
  const parts = dateString.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  // Verificar rango de mes
  if (month < 1 || month > 12) return false;

  // Verificar rango de día según el mes
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return false;

  return true;
};

/**
 * Valida una hora en formato HH:MM
 * @param {string} timeString - Hora a validar
 * @returns {boolean} true si es válida
 */
export const isValidTime = timeString => {
  if (!timeString) return false;

  // Verificar formato
  if (!/^\d{2}:\d{2}$/.test(timeString)) return false;

  // Verificar valores válidos
  const parts = timeString.split(':');
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1], 10);

  if (hour < 0 || hour > 23) return false;
  if (minute < 0 || minute > 59) return false;

  return true;
};

/**
 * Valida un formulario de paciente
 * @param {Object} formData - Datos del formulario
 * @returns {Object} Errores encontrados
 */
export const validatePatientForm = formData => {
  const errors = {};

  if (!formData.firstName?.trim()) {
    errors.firstName = 'El nombre es obligatorio';
  }

  if (!formData.lastName?.trim()) {
    errors.lastName = 'El apellido es obligatorio';
  }

  if (!formData.birthDate?.trim()) {
    errors.birthDate = 'La fecha de nacimiento es obligatoria';
  } else if (!isValidDate(formData.birthDate)) {
    errors.birthDate = 'Formato inválido. Usa YYYY-MM-DD';
  }

  if (!formData.phone?.trim()) {
    errors.phone = 'El teléfono es obligatorio';
  } else if (!isValidPhone(formData.phone)) {
    errors.phone = 'Formato de teléfono inválido';
  }

  if (formData.email && !isValidEmail(formData.email)) {
    errors.email = 'Correo electrónico inválido';
  }

  return errors;
};

/**
 * Valida un formulario de registro médico
 * @param {Object} formData - Datos del formulario
 * @param {boolean} hasPatient - Si ya se seleccionó un paciente
 * @returns {Object} Errores encontrados
 */
export const validateRecordForm = (formData, hasPatient) => {
  const errors = {};

  if (!hasPatient) {
    errors.patient = 'Debe seleccionar un paciente';
  }

  if (!formData.type) {
    errors.type = 'El tipo de registro es obligatorio';
  }

  if (!formData.title?.trim()) {
    errors.title = 'El título es obligatorio';
  }

  if (!formData.date?.trim()) {
    errors.date = 'La fecha es obligatoria';
  } else if (!isValidDate(formData.date)) {
    errors.date = 'Formato inválido. Usa YYYY-MM-DD';
  }

  if (!formData.diagnosis?.trim() && formData.type === 'consultation') {
    errors.diagnosis = 'El diagnóstico es obligatorio para consultas';
  }

  if (formData.followUpDate && !isValidDate(formData.followUpDate)) {
    errors.followUpDate = 'Formato inválido. Usa YYYY-MM-DD';
  }

  return errors;
};

/**
 * Valida un formulario de alerta/recordatorio
 * @param {Object} formData - Datos del formulario
 * @returns {Object} Errores encontrados
 */
export const validateAlertForm = formData => {
  const errors = {};

  if (!formData.title?.trim()) {
    errors.title = 'El título es obligatorio';
  }

  if (!formData.scheduledDate?.trim()) {
    errors.scheduledDate = 'La fecha es obligatoria';
  } else if (!isValidDate(formData.scheduledDate)) {
    errors.scheduledDate = 'Formato inválido. Usa YYYY-MM-DD';
  }

  if (!formData.scheduledTime?.trim()) {
    errors.scheduledTime = 'La hora es obligatoria';
  } else if (!isValidTime(formData.scheduledTime)) {
    errors.scheduledTime = 'Formato inválido. Usa HH:MM';
  }

  return errors;
};
