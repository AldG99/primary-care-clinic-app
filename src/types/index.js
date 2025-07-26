// src/types/index.js
// Definiciones de tipos para TypeScript (si usas JS puedes usarlo como referencia)

/**
 * @typedef {Object} User
 * @property {string} uid - ID único del usuario
 * @property {string} email - Correo electrónico del usuario
 * @property {string} displayName - Nombre completo del usuario
 * @property {string} role - Rol del usuario ('doctor' o 'nurse')
 * @property {string} createdAt - Fecha de creación de la cuenta
 */

/**
 * @typedef {Object} Patient
 * @property {string} id - ID único del paciente
 * @property {string} firstName - Nombre del paciente
 * @property {string} lastName - Apellido del paciente
 * @property {string} birthDate - Fecha de nacimiento (YYYY-MM-DD)
 * @property {string} gender - Género ('male' o 'female')
 * @property {string} phone - Número de teléfono
 * @property {string} email - Correo electrónico (opcional)
 * @property {string} address - Dirección (opcional)
 * @property {string} occupation - Ocupación (opcional)
 * @property {string} allergies - Alergias (opcional)
 * @property {string} medications - Medicamentos actuales (opcional)
 * @property {string} notes - Notas adicionales (opcional)
 * @property {string} lastVisit - Fecha de la última visita (opcional)
 * @property {string} upcomingAppointment - Fecha de la próxima cita (opcional)
 * @property {string} createdAt - Fecha de creación del registro
 * @property {string} lastUpdated - Fecha de última actualización
 * @property {string} createdBy - ID del usuario que creó el registro
 */

/**
 * @typedef {Object} MedicalRecord
 * @property {string} id - ID único del registro
 * @property {string} patientId - ID del paciente relacionado
 * @property {string} patientName - Nombre completo del paciente
 * @property {string} type - Tipo de registro ('consultation', 'lab', etc.)
 * @property {string} title - Título del registro
 * @property {Date} date - Fecha del registro
 * @property {string} diagnosis - Diagnóstico (opcional)
 * @property {string} summary - Resumen del registro (opcional)
 * @property {string} treatmentPlan - Plan de tratamiento (opcional)
 * @property {string} medications - Medicamentos prescritos (opcional)
 * @property {string} observations - Observaciones adicionales (opcional)
 * @property {Date} followUpDate - Fecha de seguimiento (opcional)
 * @property {string[]} tags - Etiquetas para categorizar (opcional)
 * @property {string} createdAt - Fecha de creación del registro
 * @property {string} lastUpdated - Fecha de última actualización
 * @property {string} createdBy - ID del usuario que creó el registro
 * @property {string} doctor - Nombre del médico que atendió
 */

/**
 * @typedef {Object} Alert
 * @property {string} id - ID único de la alerta
 * @property {string} title - Título de la alerta
 * @property {string} description - Descripción de la alerta (opcional)
 * @property {string} type - Tipo de alerta ('appointment', 'medication', etc.)
 * @property {Date} scheduledDate - Fecha y hora programada
 * @property {string} priority - Prioridad ('low', 'medium', 'high')
 * @property {string} patientId - ID del paciente relacionado (opcional)
 * @property {string} patientName - Nombre del paciente (opcional)
 * @property {string} relatedRecordId - ID del registro relacionado (opcional)
 * @property {string[]} assignedTo - IDs de los usuarios asignados
 * @property {boolean} completed - Estado de completitud
 * @property {string} completedAt - Fecha de completitud (opcional)
 * @property {string} createdAt - Fecha de creación de la alerta
 * @property {string} createdBy - ID del usuario que creó la alerta
 */
