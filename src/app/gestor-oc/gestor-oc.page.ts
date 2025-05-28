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
  archivoSeleccionado: File | null = null;
  nombreArchivoSeleccionado: string | null = null;
  vistaPreviaPdf: SafeResourceUrl | null = null;

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
          const pdfVistaUrl = data.archivosPDF?.archivoBase64
            ? this.crearPDFUrl(data.archivosPDF.archivoBase64)
            : null;
          return {
            ...data,
            docId: doc.payload.doc.id,
            pdfVistaUrl,
            pdfSubido: data.archivosPDF && data.archivosPDF.archivoBase64,
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

  onFileSelected(event: any, oc: any) {
    const archivoPDF = event.target.files[0];
    if (archivoPDF) {

      this.archivoSeleccionado = archivoPDF;
      this.nombreArchivoSeleccionado = archivoPDF.name;
      const reader = new FileReader();
      reader.onload = () => {
        this.vistaPreviaPdf = this.sanitizer.bypassSecurityTrustResourceUrl(reader.result as string);
      };
      reader.readAsDataURL(archivoPDF);
    }
  }


  eliminarArchivoSeleccionado() {
    this.archivoSeleccionado = null;
    this.nombreArchivoSeleccionado = null;
    this.vistaPreviaPdf = null;
    this.mostrarToast('Archivo eliminado correctamente.', 'danger');
  }

  async subirPdf(oc: any) {
    if (!this.archivoSeleccionado) {
      this.mostrarToast('No se ha seleccionado ningún archivo.', 'warning');
      return;
    }


    const archivoPDF = this.archivoSeleccionado as File;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64PDF = (reader.result as string).split(',')[1];
      const uniqueFileName = `${new Date().getTime()}_${archivoPDF.name}`;


      const fechaSubida = new Date().toISOString();

      const nuevoHistorial = [...(oc.historial || []), {
        usuario: await this.obtenerNombreUsuario(),
        estatus: 'PDF Subido',
        fecha: fechaSubida
      }];

      await this.firestore.collection('ordenes_oc').doc(oc.docId).update({
        archivosPDF: {
          archivoBase64: base64PDF,
          nombrePDF: archivoPDF.name,
          fechaSubida: fechaSubida
        },
        historial: nuevoHistorial,
      });

      await this.firestore.collection('ordenes_oc').doc(oc.docId).update({
        nuevoPdfVistaUrl: this.crearPDFUrl(base64PDF),
      });

      await this.firestore.collection('ordenes_oc').doc(oc.docId).update({
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

    if (this.archivoSeleccionado) {
      await this.subirPdf(oc);
    }

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
}
