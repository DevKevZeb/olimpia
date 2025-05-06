import axiosInstance from './axiosInstance';
import { EstudianteFormData} from '../types/index';

/**
 * Carga Boleta de pago
 * @param codigo Código de boleta de pago 
 */
export const descargarBoleta = async (codigo: string) => {
    try {
      const response = await axiosInstance.get(`/v1/ordenes-pago/descargar/${codigo}`, {
      });

     let data = response.data?.data || response.data;
      return transform(data);
    } catch (error) {
      console.error('Error al descargar boleta:', error);
      throw error;
    }
  };
  
  function getCI(data, ci){
    for(let indx = 0 ; indx < data.length; indx++)
    {
      if(data[indx].ci == ci)
        return indx;
    }

    return -1;
  }


const createNewEstudiante = (): EstudianteFormData => {
    return {
      id: `estudiante-${Date.now()}`,
      nombres: '',
      apellidos: '',
      ci: '',
      fecha_nacimiento: '',
      email: '',
      id_grado: '',
      unidad_educativa: {
        id_unidad_educativa: null,
        nombre: '',
        departamento: '',
        provincia: '',
      },
      tutor_legal: {
        nombres: '',
        apellidos: '',
        ci: '',
        telefono: '',
        email: '',
        parentesco: '',
        es_el_mismo_estudiante: false,
      },

      tutores_academicos: [],
      areas_seleccionadas: []
    };
  };

  function transform(data){

    let form :EstudianteFormData[] = [] ;

    data.orden.forEach(row => {
      
      let indx = getCI(form, row['ci']);

      if(indx === -1){
        form.push(createNewEstudiante());
        indx = form.length -1;
      }

      const area = {
        area_nombre: row['nombre_area'],
        nivel_nombre: row['nombre_nivel'],
        costo: row['costo_inscripcion']
      };

      form[indx].ci =  row['ci'];
      form[indx].nombres = row['nombres'];
      form[indx].apellidos = row['apellidos'];
      form[indx].areas_seleccionadas.push(area);
    });
    

    return {
      estudiantes:form,
      costoTotalGeneral:data.monto_total,
      encargado: {
        nombre: data.encargado.nombre,
        ci: data.encargado.ci,
      }
    };
  }