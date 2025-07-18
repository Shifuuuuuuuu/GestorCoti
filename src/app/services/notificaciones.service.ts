import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertController, ToastController } from '@ionic/angular';
import firebase from 'firebase/compat/app';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  public tieneNotificaciones$ = new BehaviorSubject<boolean>(false);
  public ocsPendientes: any[] = [];

  constructor(
    private afs: AngularFirestore,
    private auth: AngularFireAuth,
    private toast: ToastController,
    private alertController: AlertController
  ) {}

verificarOCNuevasAprobadasTiempoReal(callback: (hayNuevas: boolean) => void): void {
  this.auth.authState.subscribe(async user => {
    if (!user) return;

    const uid = user.uid;

    try {
      const userDoc = await this.afs.collection('Usuarios').doc(uid).get().toPromise();
      const userData = userDoc?.data() as any;
      const nombreUsuario = userData?.fullName || '';
      const hace5Dias = new Date();
      hace5Dias.setDate(hace5Dias.getDate() - 5);
      const desde = firebase.firestore.Timestamp.fromDate(hace5Dias);

      // Escucha en tiempo real
      this.afs.collection('ordenes_oc', ref =>
        ref.where('estatus', '==', 'Aprobado')
           .where('responsable', '==', nombreUsuario)
           .where('fechaSubida', '>=', desde)
      ).snapshotChanges().subscribe(async snapshot => {
        const todas = snapshot.map(snap => {
          const data = snap.payload.doc.data() as any;
          return { id: snap.payload.doc.id, ...data };
        });

        // Verifica vistas
        const vistasSnap = await this.afs.collection('Usuarios')
          .doc(uid).collection('notificaciones_vistas').get().toPromise();

        const vistas = vistasSnap?.docs.map(d => d.id) || [];
        const filtradas = todas.filter(oc => !vistas.includes(oc.id));

        this.ocsPendientes = filtradas;
        this.tieneNotificaciones$.next(filtradas.length > 0);
        callback(filtradas.length > 0);
      });

    } catch (error) {
      console.error('❌ Error en tiempo real:', error);
      callback(false);
    }
  });
}

async marcarOCComoVista(uid: string, idOC: string): Promise<void> {
  try {
    const userDocRef = this.afs.collection('Usuarios').doc(uid);
    const userDocSnap = await userDocRef.get().toPromise();

    if (!userDocSnap || !userDocSnap.exists) {
      console.warn('⚠️ Usuario no encontrado o snapshot indefinido al guardar OC vista.');
      return;
    }

    const userData: any = userDocSnap.data(); // <-- ahora sí puedes indexarlo

    const vistasRaw = userData['ocsVistas'];
    const vistas: string[] = Array.isArray(vistasRaw) ? vistasRaw : [];

    if (!vistas.includes(idOC)) {
      vistas.push(idOC);
      await userDocRef.update({ ocsVistas: vistas });
      console.log(`✅ OC ${idOC} marcada como vista para el usuario ${uid}`);
    } else {
      console.log(`ℹ️ OC ${idOC} ya estaba marcada como vista`);
    }

  } catch (error) {
    console.error('❌ Error al guardar vista de OC:', error);
  }
}




  limpiarNotificaciones() {
    this.tieneNotificaciones$.next(false);
    console.log('🔧 Notificaciones limpiadas');
  }
}
