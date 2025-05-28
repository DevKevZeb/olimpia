/**
 * Utilidades para validación de formularios
 * Funciones extraídas de Registration.tsx para validar campos y formularios
 */

export const validateField = (name: string, value: any) => {
  let error = '';
  switch (name) {
    case 'nombres':
    case 'apellidos':
    case 'tutor_legal.nombres':
    case 'tutor_legal.apellidos':
      if (value && value.length > 50) {
        error = 'El campo debe contener menos de 50 caracteres.';
      } else if (value && !/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]*$/.test(value)) {
        error = 'No se permiten números ni caracteres especiales.';
      }
      break;
    case 'ci':
    case 'tutor_legal.ci':
      if (value && !/^\d{1,8}$/.test(value)) {
        error = 'Debe ser un valor numérico de hasta 8 dígitos.';
      }
      break;
    case 'fecha_nacimiento': {
      if (value) {
        const selectedDate = new Date(value);
        const currentDate = new Date();
        if (selectedDate >= currentDate) {
          error = 'La fecha debe ser menor a la fecha actual.';
        }
      }
      break;
    }
    case 'telefono':
    case 'tutor_legal.telefono':
      if (value && !/^\d{1,8}$/.test(value)) {
        error = 'Solo se permiten números con un máximo de 8 dígitos.';
      }
      break;
    case 'email':
    case 'tutor_legal.email':
      if (value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          error = 'El formato del correo electrónico no es válido';
        }
      }
      break;
    case 'unidad_educativa.nombre':
      if (value && value.length > 50) {
        error = 'Debe contener menos de 50 caracteres.';
      } else if (value && !/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]*$/.test(value)) {
        error = 'No se permiten números ni caracteres especiales.';
      }
      break;
    case 'unidad_educativa.provincia':
    case 'tutor_legal.parentesco':
      if (value && value.length > 50) {
        error = 'Debe contener menos de 50 caracteres.';
      } else if (value && !/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]*$/.test(value)) {
        error = 'No se permiten números ni caracteres especiales.';
      }
      break;
    case 'id_grado':
      if (!value) {
        error = 'Debe seleccionar un grado.';
      }
      break;
    default:
      break;
  }
  return error;
};

export const validateStep1 = (
  formData: any,
  requisitosGuardados: Record<string, { obligatorio: boolean; valor: any | undefined }>
) => {
  let isValid = true;
  let currentErrors: Record<string, string> = {};
  let errorMessage = '';

  // 1. Validar campos del estudiante usando validateField
  const nombresError = validateField('nombres', formData.nombres);
  if (nombresError) {
    currentErrors.nombres = nombresError;
    isValid = false;
  }
  
  const apellidosError = validateField('apellidos', formData.apellidos);
  if (apellidosError) {
    currentErrors.apellidos = apellidosError;
    isValid = false;
  }
  
  const ciError = validateField('ci', formData.ci);
  if (ciError) {
    currentErrors.ci = ciError;
    isValid = false;
  }
  
  const fechaNacimientoError = validateField('fecha_nacimiento', formData.fecha_nacimiento);
  if (fechaNacimientoError) {
    currentErrors.fecha_nacimiento = fechaNacimientoError;
    isValid = false;
  }
  
  const emailError = validateField('email', formData.email);
  if (emailError) {
    currentErrors.email = emailError;
    isValid = false;
  }
  
  const gradoError = validateField('id_grado', formData.id_grado);
  if (gradoError) {
    currentErrors.id_grado = gradoError;
    isValid = false;
  }
  
  const unidadEducativaError = validateField('unidad_educativa.nombre', formData.unidad_educativa.nombre);
  if (unidadEducativaError) {
    currentErrors['unidad_educativa.nombre'] = unidadEducativaError;
    isValid = false;
  }

  // 2. Validar campos del tutor legal usando validateField
  const tutorNombresError = validateField('tutor_legal.nombres', formData.tutor_legal.nombres);
  if (tutorNombresError) {
    currentErrors['tutor_legal.nombres'] = tutorNombresError;
    isValid = false;
  }
  
  const tutorApellidosError = validateField('tutor_legal.apellidos', formData.tutor_legal.apellidos);
  if (tutorApellidosError) {
    currentErrors['tutor_legal.apellidos'] = tutorApellidosError;
    isValid = false;
  }
  
  const tutorCiError = validateField('tutor_legal.ci', formData.tutor_legal.ci);
  if (tutorCiError) {
    currentErrors['tutor_legal.ci'] = tutorCiError;
    isValid = false;
  }
  
  const tutorEmailError = validateField('tutor_legal.email', formData.tutor_legal.email);
  if (tutorEmailError) {
    currentErrors['tutor_legal.email'] = tutorEmailError;
    isValid = false;
  }
  
  const tutorTelefonoError = validateField('tutor_legal.telefono', formData.tutor_legal.telefono);
  if (tutorTelefonoError) {
    currentErrors['tutor_legal.telefono'] = tutorTelefonoError;
    isValid = false;
  }
  
  const tutorParentescoError = validateField('tutor_legal.parentesco', formData.tutor_legal.parentesco);
  if (tutorParentescoError) {
    currentErrors['tutor_legal.parentesco'] = tutorParentescoError;
    isValid = false;
  }

  // 3. Verificar campos obligatorios usando requisitosGuardados
  const camposObligatoriosVacios = [];
  const dataToSend = { ...formData };

  const mensajesCamposObligatorios = {
    'postulante.fecha_nacimiento': 'La fecha de nacimiento del estudiante',
    'postulante.id_unidad_educativa': 'El nombre de la unidad educativa del estudiante',
    'postulante.provincia': 'La provincia del estudiante',
    'tutorLegal.telefono': 'El teléfono del tutor legal',
    'tutorLegal.parentesco': 'El parentesco del tutor legal con el estudiante',
    'postulante.departamento': 'El departamento del estudiante',
    'postulante.id_grado': 'El grado del estudiante',
  };

  for (const key in requisitosGuardados) {
    if (key.startsWith('tutorAcademico.')) {
      continue; // Ignorar los campos del tutor académico
    }

    const requisitoInfo = requisitosGuardados[key];
    const [entidad, campo] = key.split('.');
    let fieldValue;

    if (entidad === 'tutorLegal') {
      fieldValue = dataToSend.tutor_legal[campo as keyof typeof dataToSend.tutor_legal];
    } else if (entidad === 'unidad_educativa') {
      fieldValue = dataToSend.unidad_educativa[campo as keyof typeof dataToSend.unidad_educativa];
    } else if (entidad === 'postulante') {
      if (campo === 'departamento') {
        fieldValue = dataToSend.unidad_educativa.departamento;
      } else if (campo === 'id_unidad_educativa') {
        const nombreUnidadEducativaValue = dataToSend.unidad_educativa.nombre;
        const idUnidadEducativaValue = dataToSend.unidad_educativa.id_unidad_educativa;
        if (requisitoInfo?.obligatorio && (nombreUnidadEducativaValue?.trim() === '' && (idUnidadEducativaValue === null || idUnidadEducativaValue === undefined))) {
          camposObligatoriosVacios.push(key);
        }
        continue; // Evitar la verificación general más adelante
      } else if (campo === 'provincia') {
        fieldValue = dataToSend.unidad_educativa.provincia;
      } else {
        fieldValue = dataToSend[campo as keyof typeof dataToSend];
      }
    } else {
      fieldValue = dataToSend[campo as keyof typeof dataToSend];
    }

    if (requisitoInfo?.obligatorio && (fieldValue === '' || fieldValue === null || fieldValue === undefined)) {
      camposObligatoriosVacios.push(key);
      isValid = false;
    }
  }

  if (camposObligatoriosVacios.length > 0 && !errorMessage) {
    errorMessage = `Por favor, complete los siguientes campos obligatorios: ${camposObligatoriosVacios.join(', ')}`;
  }

  if (!isValid) {
    if (Object.keys(currentErrors).length > 0) {
      errorMessage = Object.values(currentErrors)[0] as string;
    } else if (camposObligatoriosVacios.length > 0) {
      const mensajesEspecificos = camposObligatoriosVacios.map(key => mensajesCamposObligatorios[key] || key);
      errorMessage = `Por favor, complete los siguientes campos obligatorios: ${mensajesEspecificos.join(', ')}`;
    } else {
      errorMessage = 'Por favor, corrija los errores en el formulario.';
    }
  }

  return {
    isValid,
    errors: currentErrors,
    errorMessage,
    camposObligatoriosVacios
  };
};
