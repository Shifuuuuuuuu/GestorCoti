import { Insumo } from "./IInsumo";

export interface Comparacion {
  id?: string;
  codigo: string;
  solicitante: string;
  obra: string;
  prioridad: string;
  fecha_solicitud: string;
  estado?: "Aceptada" | "Rechazada" | "Pendiente"| "Archivado";
  nombre: string;
  cotizacionesPrecios: {
    empresa: string;
    insumo: string;
    precio: number;
    selected?: boolean;
    estado?: 'Aceptada' | 'Rechazada';
  }[];
  insumos: Insumo[]; // Cambiamos el tipo a la interfaz Insumo
}

