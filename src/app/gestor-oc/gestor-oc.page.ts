import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ToastController } from '@ionic/angular';
import 'firebase/compat/firestore';
import {trigger,transition,style,animate} from '@angular/animations';

@Component({
  selector: 'app-gestor-oc',
  templateUrl: './gestor-oc.page.html',
  styleUrls: ['./gestor-oc.page.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]

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


async cargarOCs() {
  const user = await this.auth.currentUser;
  const uid = user?.uid;

  if (!uid) return;

  // Obtener nombre del usuario autenticado
  const userDoc = await this.firestore.collection('Usuarios').doc(uid).get().toPromise();
  const dataUser = userDoc?.data() as any;
  const nombreUsuario = dataUser?.fullName || '';

  const responsablesFiltrados = ['Luis Orellana', 'Daniela', 'Guillermo Manzor'];
  const verSoloPropias = responsablesFiltrados.includes(nombreUsuario);

  this.firestore
    .collection('ordenes_oc', ref =>
      ref.where('estatus', '==', 'Aprobado')
    )
    .snapshotChanges()
    .subscribe(snapshot => {
      let cotizaciones = snapshot.map(doc => {
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
      });

      // Filtro por responsable si es necesario
      if (verSoloPropias) {
        cotizaciones = cotizaciones.filter(cot => cot.responsable === nombreUsuario);
      }

      // Ordenar por fecha de subida
      cotizaciones.sort((a, b) => {
        const fechaA = a.fechaSubida?.toDate?.() || new Date(0);
        const fechaB = b.fechaSubida?.toDate?.() || new Date(0);
        return fechaB.getTime() - fechaA.getTime();
      });

      this.ocs = [...cotizaciones];
      this.ocsOriginal = [...cotizaciones];
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
    const archivoPDF = this.archivosSeleccionados[ocId];
    const reader = new FileReader();

    reader.onload = async () => {
      const base64PDF = (reader.result as string).split(',')[1];
      const fechaSubida = new Date().toISOString();

      const nuevoHistorial = [...(oc.historial || []), {
        usuario: await this.obtenerNombreUsuario(),
        estatus: 'Enviada a proveedor',
        fecha: fechaSubida
      }];

      const archivosPDF = {
        archivoBase64: base64PDF,
        nombrePDF: archivoPDF.name,
        fechaSubida: fechaSubida
      };

      // Actualizar en la colección principal de OC
      await this.firestore.collection('ordenes_oc').doc(ocId).update({
        archivosPDF,
        historial: nuevoHistorial,
        estatus: 'Enviada a proveedor'
      });

      // Verificar si está asociada a una SOLPED
      if (oc.solpedId) {
        const ocRef = this.firestore.collection('solpes').doc(oc.solpedId).collection('ocs').doc(ocId);
        const dataToSave = {
          ...oc,
          archivosPDF,
          historial: nuevoHistorial,
          estatus: 'Enviada a proveedor',
          docId: ocId
        };

        try {
          const snapshot = await ocRef.get().toPromise();
          if (snapshot && snapshot.exists) {
            await ocRef.update(dataToSave);
          } else {
            await ocRef.set(dataToSave);
          }
          this.mostrarToast('OC enviada y sincronizada con su SOLPED.', 'success');
        } catch (error) {
          console.error('Error al guardar en la SOLPED:', error);
          this.mostrarToast('Error al guardar OC en SOLPED.', 'danger');
        }
      } else {
        // Si no tiene SOLPED asignada
        this.mostrarToast('OC enviada. No está vinculada a una SOLPED.', 'success');
      }

      this.cargarOCs();
    };

    reader.readAsDataURL(archivoPDF);
  } else {
    this.mostrarToast('Debes seleccionar un archivo para enviar.', 'warning');
  }
}


}
