import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Mensaje } from '../Interface/IMessage';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private firestore: AngularFirestore) {}


  private getChatId(remitenteId: string, receptorId: string): string {
    return [remitenteId, receptorId].sort().join('_');
  }


  obtenerMensajes(remitenteId: string, receptorId: string): Observable<any[]> {
    const chatId = this.getChatId(remitenteId, receptorId);
    return this.firestore.collection(`chats/${chatId}/messages`, ref =>
      ref.orderBy('timestamp', 'asc')
    ).snapshotChanges();
  }


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


  marcarMensajeVisto(mensajeId: string) {
    return this.firestore.collection('chats').doc(mensajeId).set(
      { visto: true },
      { merge: true }
    );
  }

}
