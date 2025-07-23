import { Comparaciones } from "./Icompara";

export interface Item {
  id: string;
  descripcion: string;
  item: number;
  cantidad: number;
  cantidad_cotizada: number;
  codigo_referencial: string;
  stock: number;
  numero_interno: string;
  imagen_referencia_base64: string;
  comparaciones: Comparaciones[];
  estado: string;
}
