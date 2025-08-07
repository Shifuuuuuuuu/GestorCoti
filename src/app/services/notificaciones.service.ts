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
      const userDocSnap = await this.afs.collection('Usuarios').doc(uid).get().toPromise();
      const userData = userDocSnap?.data() as any;
      const nombreUsuario = userData?.fullName || '';

      const hace5Dias = new Date();
      hace5Dias.setDate(hace5Dias.getDate() - 5);
      const desde = firebase.firestore.Timestamp.fromDate(hace5Dias);

      // 🔍 OCs donde el usuario es cotizador responsable
      const cotizadorSnap = await this.afs.collection('ordenes_oc', ref =>
        ref.where('estatus', '==', 'Aprobado')
           .where('responsable', '==', nombreUsuario)
           .where('fechaSubida', '>=', desde)
      ).get().toPromise() as firebase.firestore.QuerySnapshot<any>;

      // 🔍 SOLPEDs creadas por el usuario
      const solpedSnap = await this.afs.collection('solpes', ref =>
        ref.where('usuario', '==', nombreUsuario)
      ).get().toPromise() as firebase.firestore.QuerySnapshot<any>;

      const solpedIds = solpedSnap.docs.map((doc: firebase.firestore.QueryDocumentSnapshot<any>) => doc.id);

      // 🔍 Todas las OCs recientes (para cruzar con las SOLPEDs)
      const ocSolpedSnap = await this.afs.collection('ordenes_oc', ref =>
        ref.where('estatus', '==', 'Aprobado')
           .where('fechaSubida', '>=', desde)
      ).get().toPromise() as firebase.firestore.QuerySnapshot<any>;

      // 🔍 OCs ya vistas
      const vistasSnap = await this.afs.collection('Usuarios')
        .doc(uid).collection('notificaciones_vistas')
        .get().toPromise() as firebase.firestore.QuerySnapshot<any>;
      const vistas = vistasSnap.docs.map(doc => doc.id);

      // 📌 OCs donde soy cotizador
      const ocsCotizador = cotizadorSnap.docs
        .map(doc => ({ id: doc.id, ...(doc.data() || {}) }))
        .filter(oc => !vistas.includes(oc.id));

      // 📌 OCs que están asociadas a SOLPEDs que yo creé
      const ocsSolped = ocSolpedSnap.docs
        .map(doc => ({ id: doc.id, ...(doc.data() || {}) }))
        .filter(oc => solpedIds.includes(oc.solpedId) && !vistas.includes(oc.id));

      // ✅ Unimos y evitamos duplicados por ID
      const todas = [...ocsCotizador, ...ocsSolped].filter((value, index, self) =>
        index === self.findIndex(v => v.id === value.id)
      );

      this.ocsPendientes = todas;
      this.tieneNotificaciones$.next(todas.length > 0);
      callback(todas.length > 0);

    } catch (error) {
      console.error('❌ Error al obtener notificaciones OC:', error);
      callback(false);
    }
  });
}

async obtenerNotificacionesPersonalizadas(nombreUsuario: string, uid: string): Promise<any[]> {
  try {
    const hace5Dias = new Date();
    hace5Dias.setDate(hace5Dias.getDate() - 5);
    const desde = firebase.firestore.Timestamp.fromDate(hace5Dias);

    // 🔍 OCs donde el usuario es cotizador
    const cotizadorSnap = await this.afs.collection('ordenes_oc', ref =>
      ref.where('estatus', '==', 'Aprobado')
         .where('responsable', '==', nombreUsuario)
         .where('fechaSubida', '>=', desde)
    ).get().toPromise() as firebase.firestore.QuerySnapshot<any>;

    // 🔍 SOLPEDs creadas por el usuario
    const solpedSnap = await this.afs.collection('solpes', ref =>
      ref.where('usuario', '==', nombreUsuario)
    ).get().toPromise() as firebase.firestore.QuerySnapshot<any>;

    const solpedIds = solpedSnap.docs.map(doc => doc.id);

    // 🔍 OCs asociadas a esas SOLPEDs
    const ocSolpedSnap = await this.afs.collection('ordenes_oc', ref =>
      ref.where('estatus', '==', 'Aprobado')
         .where('fechaSubida', '>=', desde)
    ).get().toPromise() as firebase.firestore.QuerySnapshot<any>;

    // 🔍 SOLPEDs con cambio de estatus en los últimos días
    const solpedsCambiadasSnap = await this.afs.collection('solpes', ref =>
      ref.where('usuario', '==', nombreUsuario)
         .where('fechaCambio', '>=', desde)
    ).get().toPromise() as firebase.firestore.QuerySnapshot<any>;

    // 🔍 Vistas
    const vistasSnap = await this.afs.collection('Usuarios')
      .doc(uid).collection('notificaciones_vistas')
      .get().toPromise() as firebase.firestore.QuerySnapshot<any>;
    const vistas = vistasSnap?.docs.map(doc => doc.id) || [];

    // 🟢 OCs donde soy cotizador
    const ocsCotizador = cotizadorSnap.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
        tipoNotificacion: 'cotizador'
      };
    }).filter(oc => !vistas.includes(oc.id));

    // 🔵 OCs asociadas a SOLPEDs mías
    const ocsSolped = ocSolpedSnap.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
        tipoNotificacion: 'solped'
      };
    }).filter(oc => solpedIds.includes(oc.solpedId) && !vistas.includes(oc.id));

    // 🟡 Cambios en mis SOLPEDs
    const solpedNotis = solpedsCambiadasSnap.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
        tipoNotificacion: 'cambio-solped'
      };
    }).filter(solped => !vistas.includes(solped.id));

    // ✅ Unir y evitar duplicados
    const todas = [...ocsCotizador, ...ocsSolped, ...solpedNotis].filter(
      (item, index, self) => index === self.findIndex(i => i.id === item.id)
    );

    return todas;

  } catch (error) {
    console.error('❌ Error al obtener notificaciones personalizadas:', error);
    return [];
  }
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
