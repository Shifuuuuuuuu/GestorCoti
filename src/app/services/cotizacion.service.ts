import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class CotizacionService {

  constructor(private firestore: AngularFirestore) {}

  // Método para guardar una cotización
  guardarCotizacion(cotizacion: any): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        // Si es un borrador, lo guardamos con un campo 'estado' como 'Borrador'
        cotizacion.estado = cotizacion.estado || 'Pendiente';  // Por defecto es Pendiente si no se especifica
        this.firestore.collection('cotizaciones').add(cotizacion)
          .then(() => {
            resolve('Cotización guardada');
          })
          .catch((error) => {
            reject('Error al guardar cotización: ' + error);
          });
      } catch (error) {
        reject('Error al guardar cotización: ' + error);
      }
    });
  }
  // Método para guardar la imagen de cotización
guardarImagenCotizacion(imagenData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      this.firestore.collection('cotizacionImagen').add(imagenData)
        .then(() => {
          resolve('Imagen guardada');
        })
        .catch((error) => {
          reject('Error al guardar imagen: ' + error);
        });
    } catch (error) {
      reject('Error al guardar imagen: ' + error);
    }
  });
}


  obtenerCotizaciones(): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      this.firestore.collection('cotizaciones', ref => ref.orderBy('fecha', 'desc'))  // Ordena por fecha
        .get()
        .toPromise()
        .then((querySnapshot) => {
          if (!querySnapshot) {
            return reject('No se encontraron cotizaciones');
          }
          const cotizaciones: any[] = [];
          querySnapshot.forEach((doc) => {
            // Asegurarse de que data() devuelva un objeto antes de usar el spread
            const data = doc.data();
            if (data) {
              cotizaciones.push({ ...data, id: doc.id });
            }
          });
          resolve(cotizaciones);
        })
        .catch((error) => {
          reject('Error al obtener cotizaciones: ' + error);
        });
    });
  }

  obtenerBorradores(): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      this.firestore.collection('cotizaciones', ref => ref.where('estado', '==', 'Borrador'))
        .get()
        .toPromise()
        .then((querySnapshot) => {
          if (!querySnapshot) {
            return reject('No se encontraron borradores');
          }
          const borradores: any[] = [];
          querySnapshot.forEach((doc) => {
            // Asegurarse de que data() devuelva un objeto antes de usar el spread
            const data = doc.data();
            if (data) {
              borradores.push({ ...data, id: doc.id });
            }
          });
          resolve(borradores);
        })
        .catch((error) => {
          reject('Error al obtener borradores: ' + error);
        });
    });
  }


  // Método para actualizar una cotización existente (por ejemplo, para cambiar de borrador a enviado)
  actualizarCotizacion(id: string, cotizacion: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.firestore.collection('cotizaciones').doc(id).update(cotizacion)
        .then(() => {
          resolve('Cotización actualizada');
        })
        .catch((error) => {
          reject('Error al actualizar cotización: ' + error);
        });
    });
  }

  // Método para eliminar una cotización (si es necesario)
  eliminarCotizacion(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.firestore.collection('cotizaciones').doc(id).delete()
        .then(() => {
          resolve('Cotización eliminada');
        })
        .catch((error) => {
          reject('Error al eliminar cotización: ' + error);
        });
    });
  }
}
