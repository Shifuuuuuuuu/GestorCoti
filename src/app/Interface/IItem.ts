import { Comparaciones } from "./Icompara";

export interface Item {
  id: string;
  descripcion: string;
  item: number;
  cantidad: number;
  codigo_referencial: string;
  stock: number;
  numero_interno: string;
  mp10: string;
  comparaciones: Comparaciones[];
}
