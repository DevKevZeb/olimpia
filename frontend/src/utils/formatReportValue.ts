const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/;

/**
 * Convierte el valor de una columna adicional del reporte en texto legible:
 * sin comillas para los textos y con formato local para las fechas ISO.
 */
export const formatReportValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    return ISO_DATE.test(value) ? new Date(value).toLocaleDateString() : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
};
