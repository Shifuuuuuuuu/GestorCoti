export interface Solpes {
  numero_solpe: number;
  fecha: Date;
  numero_contrato: string;
  usuario: string;
  item: string;
  descripcion: string;
  codigo_referencial: string;
  cantidad: number;
  estatus?:'Solicitado'|'Aprobado'|'Rechazado'|'Aprobación Pendiente'| 'Transito a faena';
}
