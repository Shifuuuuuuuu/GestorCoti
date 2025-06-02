import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ToastController } from '@ionic/angular';
import { PDFDocument, rgb } from 'pdf-lib';
@Component({
  selector: 'app-generador-oc',
  templateUrl: './generador-oc.page.html',
  styleUrls: ['./generador-oc.page.scss'],
})
export class GeneradorOcPage implements OnInit {
  centroCosto: string = '';
  archivoPDF: File | null = null;
  historial: any[] = [];
  pdfUrl: SafeResourceUrl | null = null;
  nombrePDF: string = '';
  tipoArchivo: string = '';
  tipoCompra: string = 'stock';
  destinoCompra: string = '';
  enviando: boolean = false;
  archivo: File | null = null;
  vistaArchivoUrl: SafeResourceUrl | null = null;
  esPDF: boolean = false;

  centrosCosto: { [codigo: string]: string } = {
    "10-10-12": "ZEMAQ",
    "20-10-01": "BENÍTEZ",
    "30-10-01": "CASA MATRIZ",
    "30-10-07": "30-10-07",
    "30-10-08": "ÁRIDOS SAN JOAQUÍN",
    "30-10-42": "RAÚL ALFARO",
    "30-10-43": "DET NUEVO",
    "30-10-52": "LUIS CABRERA",
    "30-10-53": "URBANO SAN BERNARDO",
    "30-10-54": "URBANO OLIVAR",
    "30-10-57": "CALAMA",
    "30-10-58": "GASTÓN CASTILLO",
    "30-10-59": "30-10-59",
    "30-10-60": "30-10-60",
    "30-10-61": "ALTO MAIPO"
  };
  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth,
    private sanitizer: DomSanitizer,
    private toastController: ToastController
  ) {}

  ngOnInit() {}

async onFileSelected(event: any) {
  const archivoOriginal = event.target.files[0];
  if (!archivoOriginal) return;

  this.nombrePDF = archivoOriginal.name;
  const esPDF = archivoOriginal.type === 'application/pdf';
  const mimeType = archivoOriginal.type;

  const reader = new FileReader();
  reader.onload = async () => {
    const base64 = (reader.result as string).split(',')[1];

    if (!esPDF) {
      try {
        const pdfBase64 = await this.convertirImagenAPdf(base64, mimeType);
        const nombreFinal = this.nombrePDF.replace(/\.[^/.]+$/, "") + ".pdf";
        const pdfFile = this.base64ToFile(pdfBase64, nombreFinal, 'application/pdf');
        this.archivo = pdfFile;
        this.nombrePDF = nombreFinal;
        this.tipoArchivo = 'pdf';
        this.esPDF = true;

        const blob = this.base64ToBlob(pdfBase64, 'application/pdf');
        const url = URL.createObjectURL(blob);
        this.vistaArchivoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      } catch (error) {
        console.error("Error al convertir la imagen a PDF:", error);
        this.mostrarToast("Error al convertir la imagen a PDF", 'danger');
      }
    } else {
      this.archivo = archivoOriginal;
      this.tipoArchivo = 'pdf';
      this.esPDF = true;

      const blob = this.base64ToBlob(base64, mimeType);
      const url = URL.createObjectURL(blob);
      this.vistaArchivoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
  };

  reader.readAsDataURL(archivoOriginal);
}

base64ToFile(base64: string, filename: string, mimeType: string): File {
  const byteString = atob(base64);
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }
  return new File([byteArray], filename, { type: mimeType });
}

async convertirImagenAPdf(base64Imagen: string, mimeType: string): Promise<string> {
  const { PDFDocument } = await import('pdf-lib');

  const base64Clean = base64Imagen.includes(',') ? base64Imagen.split(',')[1] : base64Imagen;

  function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.length;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();

  const imageBytes = base64ToUint8Array(base64Clean);

  let image;
  if (mimeType === 'image/png') {
    image = await pdfDoc.embedPng(imageBytes);
  } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    image = await pdfDoc.embedJpg(imageBytes);
  } else {
    throw new Error(`Formato de imagen no soportado: ${mimeType}`);
  }

  const { width, height } = image.scale(1);
  page.setSize(width, height);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width,
    height,
  });

  const pdfBytes = await pdfDoc.save();
  return uint8ArrayToBase64(pdfBytes);
}




  async obtenerNuevoId(): Promise<number> {
    const snap = await this.firestore.collection('ordenes_oc', ref => ref.orderBy('id', 'desc').limit(1)).get().toPromise();
    const lastDoc = snap?.docs[0];
    const lastId = (lastDoc?.data() as any)?.id || 0;
    return lastId + 1;
  }

async enviarOC() {
  if (this.enviando) return;

  if (!this.archivo || !this.centroCosto) {
    this.mostrarToast('Por favor selecciona un archivo y Centro de Costo.', 'warning');
    return;
  }

  this.enviando = true;

  // Obtener usuario actual
  const user = await this.auth.currentUser;
  const uid = user?.uid;
  let usuario = 'Desconocido';

  if (uid) {
    const userDoc = await this.firestore.collection('Usuarios').doc(uid).get().toPromise();
    if (userDoc?.exists) {
      const userData = userDoc.data() as any;
      usuario = userData?.fullName || usuario;
    }
  }

  const fecha = new Date().toISOString();
  const id = await this.obtenerNuevoId();

  const reader = new FileReader();
  reader.onload = async () => {
    const base64PDF = (reader.result as string).split(',')[1];

    const historialEntry = {
      usuario,
      estatus: 'Preaprobado',
      fecha
    };

    const centroNombre = this.centrosCosto[this.centroCosto] || 'Desconocido';

    try {
      await this.firestore.collection('ordenes_oc').add({
        id,
        centroCosto: this.centroCosto,
        centroCostoNombre: centroNombre,
        tipoCompra: this.tipoCompra,
        destinoCompra: this.tipoCompra === 'patente' ? this.destinoCompra : '',
        estatus: 'Preaprobado',
        fechaSubida: firebase.firestore.Timestamp.fromDate(new Date()),
        nombrePDF: this.nombrePDF,
        tipoArchivo: this.tipoArchivo,
        archivoBase64: base64PDF,
        historial: [historialEntry],
        responsable: usuario
      });

      this.mostrarToast('Cotización enviada exitosamente.', 'success');


      this.centroCosto = '';
      this.archivoPDF = null;
      this.archivo = null;
      this.nombrePDF = '';
      this.tipoArchivo = '';
      this.tipoCompra = 'stock';
      this.destinoCompra = '';
      this.vistaArchivoUrl = null;
      this.pdfUrl = null;
      this.esPDF = false;

      const inputElement = document.getElementById('inputArchivo') as HTMLInputElement;
      if (inputElement) {
        inputElement.value = '';
      }
    } catch (error) {
      console.error('Error al enviar la cotización:', error);
      this.mostrarToast('Error al enviar la cotización.', 'danger');
    } finally {
      this.enviando = false;
    }
  };

  reader.readAsDataURL(this.archivo);
}






  base64ToBlob(base64: string, contentType: string): Blob {
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

    return new Blob(byteArrays, { type: contentType });
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
