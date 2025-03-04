export interface Cotizacion {
  id?: string;
  codigo: string;
  modificacion?: string;
  fecha_aprobacion: string;
  solicitante: string;
  obra: string;
  numero_correlativo: string;
  nombre_local: string;
  fecha: string;
  numero_contrato: string;
  prioridad: string;
  insumos: any[];
  estado?: 'Aceptada' | 'Rechazada'| 'Archivado';
  comentario?: string;
  nombre?: string;
}
