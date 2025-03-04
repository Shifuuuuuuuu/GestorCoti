import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map, Observable, tap } from 'rxjs';
import { Cotizacion } from '../Interface/ICotizacion';
import { Imagen } from '../Interface/IImagen';

@Injectable({
  providedIn: 'root'
})
export class VistaCotizacionesService {
  private cotizacionesCollection = 'cotizaciones';
  private imagenesCollection = 'cotizacionImagen'; // Suponiendo que tienes una colección de imágenes

  constructor(private firestore: AngularFirestore) {}

  // Obtener cotizaciones
  getCotizaciones(): Observable<Cotizacion[]> {
    return this.firestore.collection<Cotizacion>(this.cotizacionesCollection).valueChanges({ idField: 'id' });
  }

// Cambiar de 'imagenes' a 'cotizacionImagen'
getImagenes(): Observable<any[]> {
  return this.firestore.collection<any>('cotizacionImagen', ref => ref.where('estado', '==', 'Pendiente'))
    .valueChanges({ idField: 'id' }) // 🔥 Agrega el ID del documento
    .pipe(
      tap(data => console.log('Datos obtenidos de imágenes con ID:', data))
    );
}

// Obtener imágenes de cotizaciones aprobadas
getImagenesCotizacionesAprobadas(): Observable<any[]> {
  return this.firestore.collection<any>('cotizacionImagen', ref => ref.where('estado', '==', 'Aceptada'))
    .valueChanges({ idField: 'id' });
}

actualizarImagenCotizacion(id: string, data: any) {
  return this.firestore.collection('cotizacionImagen').doc(id).update(data);
}




  // Actualizar el estado de una cotización
  actualizarEstadoCotizacion(id: string, estado: 'Aceptada' | 'Rechazada'| 'Archivado', comentario: string): Promise<void> {
    return this.firestore.collection(this.cotizacionesCollection).doc(id).update({ estado, comentario });
  }

  // Actualizar el estado de una imagen
  actualizarEstadoImagen(id: string, estado: 'Aceptada' | 'Rechazada', comentario: string): Promise<void> {
    return this.firestore.collection(this.imagenesCollection).doc(id).update({ estado, comentario });
  }

  // Obtener cotizaciones pendientes
  getCotizacionesPendientesCount(): Observable<number> {
    return this.firestore.collection<Cotizacion>(this.cotizacionesCollection, ref => ref.where('estado', '==', 'Pendiente')).get()
      .pipe(
        map(snapshot => snapshot.size)  // Cuenta el número de documentos
      );
  }

  getCotizacionesAceptadasCount(): Observable<number> {
    return this.firestore.collection<Cotizacion>(this.cotizacionesCollection, ref => ref
      .where('estado', '>=', 'Aceptada')
      .where('estado', '<=', 'Aceptada' + '\uf8ff')) // Permite capturar variaciones
      .valueChanges()
      .pipe(map(cotizaciones => cotizaciones.length));
  }

    // Contar imágenes de cotizaciones pendientes
    getImagenesPendientesCount(): Observable<number> {
      return this.firestore.collection(this.imagenesCollection, ref => ref.where('estado', '==', 'Pendiente'))
        .get().pipe(map(snapshot => snapshot.size));
    }
      // Contar imágenes de cotizaciones aceptadas
      getImagenesAceptadasCount(): Observable<number> {
        return this.firestore.collection(this.imagenesCollection, ref => ref.where('estado', '==', 'Aceptada'))
          .valueChanges()
          .pipe(map(imagenes => {
            return imagenes.length;
          }));
      }
}
