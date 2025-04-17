export interface RequisitoConvocatoria {
    id?: number; // El ID es opcional al crear, se genera en la base de datos
    id_convocatoria: number;
    entidad: string;
    campo: string;
    es_obligatorio: boolean;
    created_at?: string; // Timestamps son opcionales en la interfaz
    updated_at?: string;
  }