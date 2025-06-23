import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ToastController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';
@Component({
  selector: 'app-validar-oc',
  templateUrl: './validar-oc.page.html',
  styleUrls: ['./validar-oc.page.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ValidarOcPage implements OnInit {
  ocs: any[] = [];
  loading = true;

  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth,
    private sanitizer: DomSanitizer,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.cargarOCs();
  }

async cargarOCs() {
  this.loading = true;

  try {
    const snapshot = await this.firestore
      .collection('ordenes_oc', ref => ref.where('estatus', '==', 'Preaprobado'))
      .get()
      .toPromise();

    if (!snapshot) {
      this.ocs = [];
      return;
    }

    this.ocs = snapshot.docs.map(doc => {
      const data = doc.data() as any;
      const base64 = data.archivoBase64 || '';
      let archivoTipo = 'application/octet-stream';

      if (base64.startsWith('JVBERi')) archivoTipo = 'application/pdf';
      else if (base64.startsWith('/9j/')) archivoTipo = 'image/jpeg';
      else if (base64.startsWith('iVBORw0')) archivoTipo = 'image/png';

      const historialOrdenado = (data.historial || []).sort((a: any, b: any) => {
        const fechaA = a.fecha?.toDate?.() || new Date(a.fecha) || new Date(0);
        const fechaB = b.fecha?.toDate?.() || new Date(b.fecha) || new Date(0);
        return fechaA.getTime() - fechaB.getTime();
      });

      return {
        docId: doc.id,
        ...data,
        historial: historialOrdenado,
        archivoBase64: base64,
        archivoUrl: null,
        mostrarArchivo: false,
        esPDF: archivoTipo === 'application/pdf',
        esImagen: archivoTipo.startsWith('image/'),
        comentarioTemporal: ''
      };
    }).sort((a, b) => {
      const fechaA = a.fechaSubida?.toDate?.() || new Date(0);
      const fechaB = b.fechaSubida?.toDate?.() || new Date(0);
      return fechaA.getTime() - fechaB.getTime();
    });

  } catch (error) {
    console.error('Error al cargar OCs:', error);
    this.ocs = [];
  } finally {
    this.loading = false;
  }
}


  verArchivo(oc: any) {
    if (!oc.mostrarArchivo && oc.archivoBase64) {
      const tipo = oc.esPDF ? 'application/pdf' : (oc.esImagen ? 'image/png' : 'application/octet-stream');
      oc.archivoUrl = this.crearArchivoUrl(oc.archivoBase64, tipo);
      oc.mostrarArchivo = true;
    }
  }

  crearArchivoUrl(base64: string, tipo: string): SafeResourceUrl {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: tipo });
    const url = URL.createObjectURL(blob);

    return tipo === 'application/pdf'
      ? this.sanitizer.bypassSecurityTrustResourceUrl(url)
      : this.sanitizer.bypassSecurityTrustUrl(url);
  }

  getColorByStatus(estatus: string): string {
    switch (estatus) {
      case 'Aprobado': return '#28a745';
      case 'Rechazado': return '#dc3545';
      case 'Preaprobado': return '#ffc107';
      case 'OC enviada a proveedor': return '#17a2b8';
      case 'Por Importación': return '#6f42c1';
      default: return '#6c757d';
    }
  }

  async obtenerNombreUsuario(): Promise<string> {
    const user = await this.auth.currentUser;
    const uid = user?.uid;
    if (!uid) return 'Desconocido';

    const userDoc = await this.firestore.collection('Usuarios').doc(uid).get().toPromise();
    const data = userDoc?.data() as { fullName?: string };
    return data?.fullName || 'Desconocido';
  }

  async aprobarOC(oc: any) {
    const comentario = oc.comentarioTemporal?.trim();
    if (!comentario) {
      this.mostrarToast('Por favor escribe un comentario antes de aprobar.', 'warning');
      return;
    }

    const usuario = await this.obtenerNombreUsuario();
    const fecha = new Date().toISOString();

    const nuevoHistorial = [...(oc.historial || []), {
      usuario,
      estatus: 'Aprobado',
      fecha,
      comentario
    }];

    await this.firestore.collection('ordenes_oc').doc(oc.docId).update({
      estatus: 'Aprobado',
      historial: nuevoHistorial
    });

    this.ocs = this.ocs.filter(item => item.docId !== oc.docId);
    this.mostrarToast('OC aprobada con éxito.', 'success');
  }

  async rechazarOC(oc: any) {
    const comentario = oc.comentarioTemporal?.trim();
    if (!comentario) {
      this.mostrarToast('Por favor escribe un comentario antes de rechazar.', 'warning');
      return;
    }

    const usuario = await this.obtenerNombreUsuario();
    const fecha = new Date().toISOString();

    const nuevoHistorial = [...(oc.historial || []), {
      usuario,
      estatus: 'Rechazado',
      fecha,
      comentario
    }];

    await this.firestore.collection('ordenes_oc').doc(oc.docId).update({
      estatus: 'Rechazado',
      historial: nuevoHistorial
    });

    this.ocs = this.ocs.filter(item => item.docId !== oc.docId);
    this.mostrarToast('OC rechazada con éxito.', 'danger');
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
