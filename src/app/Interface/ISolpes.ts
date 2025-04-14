import { Item } from "./IItem";

export interface Solpes {
  numero_solpe: number;
  fecha: any;
  numero_contrato: string;
  usuario: string;
  items: Item[];
  descripcion: string;
  codigo_referencial: string;
  cantidad: number;
  factura: string;
  m10: string;
  estatus?:'Solicitado'|'Aprobado'|'Rechazado'|'Aprobación Pendiente'| 'Transito a faena';
}
