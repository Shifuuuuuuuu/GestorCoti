import { CotizacionPrecio } from "./ICotizacionPrecio";

export interface Insumo {
  item: string;
  unidad: string;
  descripcion: string;
  solicitud: number;
  precios: CotizacionPrecio[];
}
