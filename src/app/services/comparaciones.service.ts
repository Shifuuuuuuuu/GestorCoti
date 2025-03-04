import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Comparacion } from '../Interface/IComparacion';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ComparacionesService {
  private collectionName = 'comparacionesCotizaciones';
  private imagenesCollection = 'comparativaImagen';

  constructor(private firestore: AngularFirestore) {}

  // Obtener comparaciones
  getComparaciones(): Observable<Comparacion[]> {
    return this.firestore.collection<Comparacion>(this.collectionName).valueChanges({ idField: 'id' });
  }

  // Actualizar la selección de un insumo
  actualizarSeleccion(id: string, insumo: string, comentario: string): Promise<void> {
    return this.firestore.collection(this.collectionName).doc(id).update({ seleccionado: insumo, comentario });
  }

  // Enviar seleccionados
  enviarSeleccionados(seleccionados: { insumo: string; empresa: string; precio: number }[]): Promise<void> {
    const batch = this.firestore.firestore.batch();

    seleccionados.forEach((item) => {
      const docRef = this.firestore.collection(this.collectionName).doc(item.insumo).ref;
      batch.update(docRef, { seleccionado: true });
    });

    return batch.commit();
  }

  // Actualizar estado de una comparación
  actualizarComparacion(id: string, data: Partial<Comparacion>): Promise<void> {
    return this.firestore.collection(this.collectionName).doc(id).update(data);
  }

  // Obtener imágenes pendientes
  getImagenes(): Observable<any[]> {
    return this.firestore.collection(this.imagenesCollection, ref => ref.where('estado', '==', 'Pendiente'))
      .valueChanges({ idField: 'id' });
  }

  // Actualizar estado de una imagen (Aceptar/Rechazar)
  actualizarEstadoImagen(id: string, estado: 'Aceptada' | 'Rechazada'): Promise<void> {
    return this.firestore.collection(this.imagenesCollection).doc(id).update({ estado });
  }
}
