import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-gestor-oc',
  templateUrl: './gestor-oc.page.html',
  styleUrls: ['./gestor-oc.page.scss'],
})
export class GestorOcPage implements OnInit {
  ocs: any[] = [];

  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth,
    private sanitizer: DomSanitizer,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.cargarOCs();
  }

  cargarOCs() {
    this.firestore
      .collection('ordenes_oc', ref => ref.where('estatus', '==', 'Aprobado'))
      .snapshotChanges()
      .subscribe(snapshot => {
        this.ocs = snapshot.map(doc => {
          const data = doc.payload.doc.data() as any;
          const pdfVistaUrl = data.archivoBase64
            ? this.crearPDFUrl(data.archivoBase64)
            : null;
          return {
            ...data,
            docId: doc.payload.doc.id,
            pdfVistaUrl
          };
        });
      });
  }

  crearPDFUrl(base64: string): SafeResourceUrl {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    const blob = new Blob(byteArrays, { type: 'application/pdf' });
    return this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob));
  }

  async obtenerNombreUsuario(): Promise<string> {
    const user = await this.auth.currentUser;
    const uid = user?.uid;
    if (!uid) return 'Desconocido';

    const userDoc = await this.firestore.collection('Usuarios').doc(uid).get().toPromise();
    const data = userDoc?.data() as { fullName?: string };
    return data?.fullName || 'Desconocido';
  }

  async marcarComoEnviada(oc: any) {
    const usuario = await this.obtenerNombreUsuario();
    const fecha = new Date().toISOString();

    const nuevoHistorial = [...(oc.historial || []), {
      usuario,
      estatus: 'Enviada a proveedor',
      fecha
    }];

    await this.firestore.collection('ordenes_oc').doc(oc.docId).update({
      estatus: 'Enviada a proveedor',
      historial: nuevoHistorial
    });

    this.mostrarToast('OC marcada como "Enviada a proveedor".', 'success');
    this.cargarOCs();
  }

  async mostrarToast(mensaje: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      color,
      position: 'top'
    });
    toast.present();
  }
}
