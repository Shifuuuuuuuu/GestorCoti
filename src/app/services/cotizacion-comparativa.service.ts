import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CotizacionComparativaService {
  private collectionName = 'comparacionesCotizaciones';
  private imagenCollectionName = 'comparativaImagen';

  constructor(private firestore: AngularFirestore) {}

  // Método para guardar una comparación de cotización
  guardarComparacion(cotizacionComparativa: any) {
    return this.firestore.collection(this.collectionName).add(cotizacionComparativa);
  }


  // Método para obtener todas las comparaciones de cotizaciones
  obtenerComparaciones() {
    return this.firestore.collection(this.collectionName).snapshotChanges();
  }

  // Método para obtener una comparación por ID
  obtenerComparacionPorId(id: string) {
    return this.firestore.collection(this.collectionName).doc(id).get();
  }
    // Obtener cotizaciones comparativas
    obtenerCotizacionesComparativas(): Promise<any[]> {
      return new Promise<any[]>((resolve, reject) => {
        this.firestore.collection('cotizaciones_comparativas', ref => ref.where('estado', '==', 'Borrador'))
          .get()
          .subscribe(
            (querySnapshot) => {
              const cotizaciones = querySnapshot.docs.map(doc => doc.data());
              resolve(cotizaciones);
            },
            (error) => {
              console.error('Error al obtener cotizaciones:', error);
              reject(error);
            }
          );
      });
    }
    // Guardar cotización comparativa como borrador
guardarCotizacionComparativa(cotizacion: any): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // Referencia a la colección 'cotizaciones_comparativas'
    this.firestore.collection('cotizaciones_comparativas').add(cotizacion)
      .then(() => {
        console.log('Borrador guardado con éxito');
        resolve();
      })
      .catch((error) => {
        console.error('Error al guardar el borrador:', error);
        reject(error);
      });
  });
}



  // Método para actualizar una comparación
  actualizarComparacion(id: string, data: any) {
    return this.firestore.collection(this.collectionName).doc(id).update(data);
  }

  // Método para eliminar una comparación
  eliminarComparacion(id: string) {
    return this.firestore.collection(this.collectionName).doc(id).delete();
  }
  guardarCotizacion(cotizacion: any) {
    return this.firestore.collection(this.collectionName).add(cotizacion);
  }
  getComparacionesPendientesCount(): Observable<number> {
    return this.firestore.collection('comparacionesCotizaciones', ref => ref.where('estado', '==', 'Pendiente')).get()
      .pipe(
        map(snapshot => snapshot.size)  // Cuenta el número de documentos
      );
  }


  getComparacionesAceptadasCount(): Observable<number> {
    return this.firestore.collection(this.collectionName, ref => ref.where('estado', '==', 'Aceptada'))
      .valueChanges()
      .pipe(map(comparaciones => comparaciones.length));
  }
// Método para guardar una imagen en la colección comparativaImagen
guardarImagenComparativa(imagenData: { base64: string, nombre: string, tipo: string }) {
  const imagen = {
    imagen: imagenData.base64,  // Usar imagenBase64
    nombre: imagenData.nombre,  // Usar el nombre
    tipo: imagenData.tipo,      // Guardar el tipo de imagen
    timestamp: new Date(),      // Marca de tiempo
    estado: 'Pendiente'         // Estado inicial
  };

  return this.firestore.collection(this.imagenCollectionName).add(imagen);
}


actualizarImagenComparativa(id: string, datos: any): Promise<any> {
  console.log('Intentando actualizar comparativa con ID:', id, 'y datos:', datos); // Verificación adicional

  // Verifica que el documento con el id existe
  return this.firestore.collection('comparativaImagen').doc(id).get().toPromise().then((doc) => {
    if (doc && doc.exists) {
      console.log('Documento encontrado:', doc.id);
      return this.firestore.collection('comparativaImagen').doc(id).update(datos);
    } else {
      console.error('No se encuentra el documento con ID:', id);
      return Promise.reject('Documento no encontrado');
    }
  }).catch((error) => {
    console.error('Error al obtener el documento:', error);
    return Promise.reject(error);
  });
}

actualizarImagenCotizacion(id: string, datos: any): Promise<any> {
  console.log('Intentando actualizar cotización con ID:', id, 'y datos:', datos); // Verificación adicional

  // Verifica que el documento con el id existe
  return this.firestore.collection('cotizacionImagen').doc(id).get().toPromise().then((doc) => {
    if (doc && doc.exists) {
      console.log('Documento encontrado:', doc.id);
      return this.firestore.collection('cotizacionImagen').doc(id).update(datos);
    } else {
      console.error('No se encuentra el documento con ID:', id);
      return Promise.reject('Documento no encontrado');
    }
  }).catch((error) => {
    console.error('Error al obtener el documento:', error);
    return Promise.reject(error);
  });
}



    // Método para obtener todas las imágenes
    obtenerImagenesComparativas() {
      return this.firestore.collection(this.imagenCollectionName).snapshotChanges();
    }
  // Contar imágenes de comparaciones pendientes
  getComparacionesImagenesPendientesCount(): Observable<number> {
    return this.firestore.collection(this.imagenCollectionName, ref => ref.where('estado', '==', 'Pendiente'))
      .get().pipe(map(snapshot => snapshot.size));
  }

  getComparacionesImagenesAceptadasCount(): Observable<number> {
    return this.firestore.collection(this.imagenCollectionName, ref => ref.where('estado', '==', 'Aceptada'))
      .valueChanges()
      .pipe(map(imagenes => imagenes.length));
  }
  // Obtener imágenes de comparaciones aprobadas
getImagenesComparacionesAprobadas(): Observable<any[]> {
  return this.firestore.collection<any>(this.imagenCollectionName, ref => ref.where('estado', '==', 'Aceptada'))
    .valueChanges({ idField: 'id' });
}

}
