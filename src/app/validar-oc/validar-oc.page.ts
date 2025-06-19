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
    .collection('ordenes_oc', ref =>
      ref.where('estatus', '==', 'Preaprobado')
    )
    .snapshotChanges()
    .subscribe((snap) => {
      this.ocs = snap
        .map(doc => {
          const data = doc.payload.doc.data() as any;
          const base64 = data.archivoBase64 || '';
          const nombrePDF = data.nombrePDF || '';
          let archivoTipo = 'application/octet-stream';

          if (base64.startsWith('JVBERi')) {
            archivoTipo = 'application/pdf';
          } else if (base64.startsWith('/9j/')) {
            archivoTipo = 'image/jpeg';
          } else if (base64.startsWith('iVBORw0')) {
            archivoTipo = 'image/png';
          }

          const archivoUrl = base64
            ? this.crearArchivoUrl(base64, archivoTipo)
            : null;

          const historialOrdenado = (data.historial || []).sort((a: any, b: any) => {
            const fechaA = a.fecha?.toDate?.() || new Date(a.fecha) || new Date(0);
            const fechaB = b.fecha?.toDate?.() || new Date(b.fecha) || new Date(0);
            return fechaA.getTime() - fechaB.getTime();
          });

          return {
            docId: doc.payload.doc.id,
            ...data,
            historial: historialOrdenado,
            archivoUrl,
            esPDF: archivoTipo === 'application/pdf',
            esImagen: archivoTipo.startsWith('image/'),
            comentarioTemporal: ''
          };
        })
        .sort((a, b) => {
          const fechaA = a.fechaSubida?.toDate?.() || new Date(0);
          const fechaB = b.fechaSubida?.toDate?.() || new Date(0);
          return fechaA.getTime() - fechaB.getTime(); // <--- Invertido
        });
    });
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
  crearPDFUrl(base64: string): SafeResourceUrl {
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

    const blob = new Blob(byteArrays, { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
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

    this.mostrarToast('OC aprobada con éxito.', 'success');
    this.cargarOCs();
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

    this.mostrarToast('OC rechazada con éxito.', 'danger');
    this.cargarOCs();
  }
}
