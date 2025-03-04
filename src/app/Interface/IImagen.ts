 export interface Imagen {
  id: string;
  codigo: string;
  imagenUrl: string;
  tipo: 'cotizacion' | 'comparativa'; // Asegúrate de que tipo exista en las imágenes
  estado: 'Pendiente' | 'Archivado' | 'Aprobada';
  fecha: string;
  nombre: string;
}
