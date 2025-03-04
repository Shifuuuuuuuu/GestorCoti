export interface Mensaje {
  id?: string;
  remitenteId: string;
  receptorId: string;
  mensaje: string;
  nombreRemitente: string;
  timestamp: any;
  visto: boolean;
  vistoPorAmbos?: boolean;
}
