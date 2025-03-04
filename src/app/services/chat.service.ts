import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Mensaje } from '../Interface/IMessage';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private firestore: AngularFirestore) {}

  // Obtener el chatId basado en los IDs de los usuarios
  private getChatId(remitenteId: string, receptorId: string): string {
    return [remitenteId, receptorId].sort().join('_');  // Crear un ID único para cada par de usuarios
  }

  // Obtener los mensajes de un chat específico
  obtenerMensajes(remitenteId: string, receptorId: string): Observable<any[]> {
    const chatId = this.getChatId(remitenteId, receptorId);
    return this.firestore.collection(`chats/${chatId}/messages`, ref =>
      ref.orderBy('timestamp', 'asc')  // Ordenar por timestamp
    ).snapshotChanges();  // Usar snapshotChanges para obtener en tiempo real
  }

  // Enviar un mensaje a un chat específico
// Enviar un mensaje a un chat específico
enviarMensaje(remitenteId: string, receptorId: string, mensaje: string) {
  const chatId = this.getChatId(remitenteId, receptorId);
  const mensajeData = {
    remitenteId,
    receptorId,
    mensaje,
    timestamp: new Date()
  };
  return this.firestore.collection(`chats/${chatId}/messages`).add(mensajeData);
}

  // Método para marcar un mensaje como visto
  marcarMensajeVisto(mensajeId: string) {
    return this.firestore.collection('chats').doc(mensajeId).set(
      { visto: true },
      { merge: true } // 🔹 Si el documento no existe, lo crea
    );
  }

}
