import { Comparaciones } from "./Icompara";

export interface Item {
  id: string;
  descripcion: string;
  item: number;
  cantidad: number;
  codigo_referencial: string;
  comparaciones: Comparaciones[];
}
