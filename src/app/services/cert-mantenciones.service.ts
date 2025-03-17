import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { rejects } from 'assert';
import { resolve } from 'path';
import { queryObjects } from 'v8';

@Injectable({
  providedIn: 'root'
})
export class CertMantencionesService {
  constructor(private firestore: AngularFirestore) {}

  guardarCertificado(equipo : any): Promise<any>{
    return new Promise((resolver, rejects)=>{
      try{
        this.firestore.collection('certificado_manteciones').add(equipo)
        .then(()=>{
          resolver('Certificado guardado');
        })
        .catch((error)=> {
          rejects('Error al guardar certificado'+ error);
        });
      } catch (error){
        rejects('Error al guadar certificado'+ error)
      }
    });
  }
  obtenerEquipo(): Promise <any[]>{
    return new Promise<any[]>((resolve,rejects)=>{
      this.firestore.collection('certificado_manteciones', ref => ref.orderBy('fecha','desc'))
      .get()
      .toPromise()
      .then((querySnapshot)=>{
        if(!querySnapshot){
          return rejects('No se encontro equipo');
        }
        const certificado: any[]=[];
        querySnapshot?.forEach((doc)=>{
          const data = doc.data();
          if (data){
            certificado.push({ ...data,id: doc.id});
          }
        });
        resolve(certificado);
      })
      .catch((error)=> {
        rejects('Error al obtener certificado:' + error)
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
