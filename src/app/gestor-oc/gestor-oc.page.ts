import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ToastController } from '@ionic/angular';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
@Component({
  selector: 'app-gestor-oc',
  templateUrl: './gestor-oc.page.html',
  styleUrls: ['./gestor-oc.page.scss'],
})
export class GestorOcPage implements OnInit {
  ocs: any[] = [];
  busquedaId: string = '';
  ocsOriginal: any[] = [];

  archivoSeleccionado: File | null = null;
  nombreArchivoSeleccionado: string | null = null;
  vistaPreviaPdf: SafeResourceUrl | null = null;
  archivosSeleccionados: { [key: string]: File } = {};
  nombresArchivos: { [key: string]: string } = {};
  vistasPreviasPdf: { [key: string]: SafeResourceUrl } = {};
  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth,
    private sanitizer: DomSanitizer,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.cargarOCs();
  }
buscarPorId() {
  const busqueda = this.busquedaId.trim().toLowerCase();
  if (busqueda === '') {
    this.ocs = [...this.ocsOriginal];
  } else {
  this.ocs = this.ocsOriginal.filter(oc => {
    return oc.id?.toString() === busqueda;
  });
  }
}


cargarOCs() {
  this.firestore
    .collection('ordenes_oc', ref =>
      ref.where('estatus', '==', 'Aprobado')
    )
    .snapshotChanges()
    .subscribe(snapshot => {
      const cotizaciones = snapshot.map(doc => {
        const data = doc.payload.doc.data() as any;
        const archivoBase64 = data.archivosPDF?.archivoBase64;
        const urlPDF = archivoBase64 ? this.crearPDFUrl(archivoBase64) : null;
        return {
          ...data,
          docId: doc.payload.doc.id,
          cotizacion: archivoBase64 ? {
            url: urlPDF,
            tipo: 'application/pdf'
          } : null,
        };
      }).sort((a, b) => {
        const fechaA = a.fechaSubida?.toDate?.() || new Date(0);
        const fechaB = b.fechaSubida?.toDate?.() || new Date(0);
        return fechaB.getTime() - fechaA.getTime();
      });

      this.ocs = [...cotizaciones];         // se usa para mostrar
      this.ocsOriginal = [...cotizaciones]; // se usa para buscar
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

onFileSelected(event: any, oc: any) {
  const archivoPDF = event.target.files[0];
  if (archivoPDF) {
    const ocId = oc.docId;

    this.archivosSeleccionados[ocId] = archivoPDF;
    this.nombresArchivos[ocId] = archivoPDF.name;

    const reader = new FileReader();
    reader.onload = () => {
      this.vistasPreviasPdf[ocId] = this.sanitizer.bypassSecurityTrustResourceUrl(reader.result as string);
    };
    reader.readAsDataURL(archivoPDF);
  }
}



eliminarArchivoSeleccionado(oc: any) {
  const ocId = oc.docId;
  delete this.archivosSeleccionados[ocId];
  delete this.nombresArchivos[ocId];
  delete this.vistasPreviasPdf[ocId];
  this.mostrarToast('Archivo eliminado correctamente.', 'danger');
}


async subirPdf(oc: any) {
  const ocId = oc.docId;
  const archivoPDF = this.archivosSeleccionados[ocId];
  if (!archivoPDF) {
    this.mostrarToast('No se ha seleccionado ningún archivo.', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = async () => {
    const base64PDF = (reader.result as string).split(',')[1];
    const fechaSubida = new Date().toISOString();

    const nuevoHistorial = [...(oc.historial || []), {
      usuario: await this.obtenerNombreUsuario(),
      estatus: 'PDF Subido',
      fecha: fechaSubida
    }];

    await this.firestore.collection('ordenes_oc').doc(ocId).update({
      archivosPDF: {
        archivoBase64: base64PDF,
        nombrePDF: archivoPDF.name,
        fechaSubida: fechaSubida
      },
      historial: nuevoHistorial,
      pdfSubido: true
    });

    this.mostrarToast('PDF subido correctamente.', 'success');
    this.cargarOCs();
  };

  reader.readAsDataURL(archivoPDF);
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

async marcarComoEnviada(oc: any) {
  const ocId = oc.docId;
  if (this.archivosSeleccionados[ocId]) {
    await this.subirPdf(oc);
  }

  const usuario = await this.obtenerNombreUsuario();
  const fecha = new Date().toISOString();

  const nuevoHistorial = [...(oc.historial || []), {
    usuario,
    estatus: 'Enviada a proveedor',
    fecha
  }];

  await this.firestore.collection('ordenes_oc').doc(ocId).update({
    estatus: 'Enviada a proveedor',
    historial: nuevoHistorial
  });

  this.mostrarToast('OC marcada como "Enviada a proveedor".', 'success');
  this.cargarOCs();
}

}
