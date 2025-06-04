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
        error = `El campo ${name} debe contener menos de 50 caracteres.`;
      } else if (value && !/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]*$/.test(value)) {
        error = `El campo ${name} no se permiten números ni caracteres especiales.`;
      } else if (value === ''){
        error = `El campo ${name} no debe estar vacio`;
      }
      break;
    case 'unidad_educativa.departamento':
      if (value && value.length > 50) {
        error = `El campo departamento debe contener menos de 50 caracteres.`;
      } else if (value && !/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]*$/.test(value)) {
        error = `El campo departamento no permite números ni caracteres especiales.`;
      } else if (value === ''){
        error = `El campo departamento no debe estar vacio`;
      }
      break;
    case 'ci':
    case 'tutor_legal.ci':
      if (value && !/^\d{1,8}$/.test(value)) {
        error = `El campo ${name} debe ser un valor numérico de hasta 8 dígitos.`;
      } else if (value === ''){
        error = `El campo ${name} no debe estar vacio`;
      }
      break;
    case 'fecha_nacimiento': {
      if (value) {
        const selectedDate = new Date(value);
        const currentDate = new Date();
        if (selectedDate >= currentDate) {
          error = `El campo ${name} debe ser menor a la fecha actual.`;
        }
      } else if (value === ''){
        error = `El campo ${name} no debe estar vacio`;
      }
      break;
    }
    case 'telefono':
    case 'tutor_legal.telefono':
      if (value && !/^\d{1,8}$/.test(value)) {
        error = `El campo ${name} solo permiten números con un máximo de 8 dígitos.`;
      } else if (value === ''){
        error = `El campo ${name} no debe estar vacio`;
      }
      break;
    case 'email':
    case 'tutor_legal.email':
      if (value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          error = `El campo ${name} (Correo Electronico) no es válido`;
        }
      } else if (value === ''){
        error = `El campo ${name} (Correo Electronico) no debe estar vacio`;
      }
      break;
    case 'unidad_educativa.nombre':
      if (value && value.length > 50) {
        error = `El campo unidad educativa debe contener menos de 50 caracteres.`;
      } else if (value && !/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]*$/.test(value)) {
        error = `El campo unidadd educativa no permite números ni caracteres especiales.`;
      } else if (value === ''){
        error = `El campo unidad educativa no debe estar vacio`;
      }
      break;    
    case 'unidad_educativa.provincia':
      if (value && value.length > 50) {
        error = `El campo provincia Debe contener menos de 50 caracteres.`;
      } else if (value && !/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s/]*$/.test(value)) {
        error = `El campo provincia no permiten números ni caracteres especiales.`;
      } else if (value === ''){
        error = `El campo provincia no debe estar vacio`;
      }
      break;
    case 'tutor_legal.parentesco':
      if (value && value.length > 50) {
        error = 'El campo parentesco debe contener menos de 50 caracteres.';
      } else if (value && !/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s/]*$/.test(value)) {
        error = 'El campo parentesco no permiten números ni caracteres especiales (excepto /).';
      }else if (value === ''){
        error = `El campo parentesco no debe estar vacio`;
      }
      break;
    case 'id_grado':
      if (!value) {
        error = ` Debe seleccionar un grado.`;
      }else if (value === ''){
        error = `El campo Grado no debe estar vacio`;
      }
      break;
    case 'genero':
      if (!value) {
        error = 'Debe seleccionar un género.';
      } else if (!['Masculino', 'Femenino'].includes(value)) {
        error = 'Debe seleccionar una opción válida.';
      }
      break;
    default:
      break;
  }
  return error;
};

export const validateStep1 = (
  formData: any,
  requisitosGuardados: Array<{ entidad: string; campo: string; es_obligatorio: boolean }>
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
  
  const requisitoFechaNacimiento = requisitosGuardados.find(
    req =>req.entidad ==='postulante' && req.campo === 'fecha_nacimiento'
  );
  if (requisitoFechaNacimiento){
    const fechaNacimientoError = validateField('fecha_nacimiento', formData.fecha_nacimiento);
    if (fechaNacimientoError) {
      currentErrors.fecha_nacimiento = fechaNacimientoError;
      isValid = false;
    }
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

  const requisitoGenero = requisitosGuardados.find(
    req =>req.entidad ==='postulante' && req.campo === 'genero'
  );
  if(requisitoGenero){
    const generoError = validateField('genero', formData.genero);
    if (generoError) {
      currentErrors.genero = generoError;
      isValid = false;
    }
  }
  
  const requisitoUnidadEducativa = requisitosGuardados.find(
    req =>req.entidad ==='postulante' && req.campo === 'id_unidad_educativa'
  );
  if(requisitoUnidadEducativa){
    const unidadEducativaError = validateField('unidad_educativa.nombre', formData.unidad_educativa.nombre);
    if (unidadEducativaError) {
      currentErrors['unidad_educativa.nombre'] = unidadEducativaError;
      isValid = false;
    }
  }

  const requisitoDepartamneto = requisitosGuardados.find(
    req =>req.entidad ==='postulante' && req.campo === 'departamento'
  );
  if(requisitoDepartamneto){
    const unidadEducativaDepartamnetoError = validateField('unidad_educativa.departamento', formData.unidad_educativa.departamento);
    if (unidadEducativaDepartamnetoError) {
      currentErrors['unidad_educativa.departamento'] = unidadEducativaDepartamnetoError;
      isValid = false;
    }
  }

  const requisitoProvincia = requisitosGuardados.find(
    req =>req.entidad ==='postulante' && req.campo === 'provincia'
  );
  if(requisitoProvincia){
    const unidadEducativaProvinciaError = validateField('unidad_educativa.provincia', formData.unidad_educativa.provincia);
    if (unidadEducativaProvinciaError) {
      currentErrors['unidad_educativa.provincia'] = unidadEducativaProvinciaError;
      isValid = false;
    }
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
  
  const requisitoTutorTelefono = requisitosGuardados.find(
    req =>req.entidad ==='tutorLegal' && req.campo === 'telefono'
  );
  if(requisitoTutorTelefono){
    const tutorTelefonoError = validateField('tutor_legal.telefono', formData.tutor_legal.telefono);
    if (tutorTelefonoError) {
      currentErrors['tutor_legal.telefono'] = tutorTelefonoError;
      isValid = false;
    }
  }
  
  const requisitoTutorParentesco = requisitosGuardados.find(
    req =>req.entidad ==='tutorLegal' && req.campo === 'parentesco'
  );
  if(requisitoTutorParentesco){
    const tutorParentescoError = validateField('tutor_legal.parentesco', formData.tutor_legal.parentesco);
    if (tutorParentescoError) {
      currentErrors['tutor_legal.parentesco'] = tutorParentescoError;
      isValid = false;
    }
  }

  return {
    isValid,
    errors: currentErrors,
    errorMessage,
  };
};
