import { Comparaciones } from "./Icompara";

export interface Item {
  id: string;
  descripcion: string;
  item: number;
  cantidad: number;
  codigo_referencial: string;
  stock: number;
  comparaciones: Comparaciones[];
}
