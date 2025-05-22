import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
  tipoCompra: string = '';
  destinoCompra: string = '';

  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {}

onFileSelected(event: any) {
  this.archivoPDF = event.target.files[0];
  if (this.archivoPDF) {
    this.nombrePDF = this.archivoPDF.name;

    const reader = new FileReader();
    reader.onload = () => {
      const base64PDF = (reader.result as string).split(',')[1];
      const blob = this.base64ToBlob(base64PDF, 'application/pdf');
      const url = URL.createObjectURL(blob);
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    };
    reader.readAsDataURL(this.archivoPDF);
  }
}


  async obtenerNuevoId(): Promise<number> {
    const snap = await this.firestore.collection('ordenes_oc', ref => ref.orderBy('id', 'desc').limit(1)).get().toPromise();
    const lastDoc = snap?.docs[0];
    const lastId = (lastDoc?.data() as any)?.id || 0;
    return lastId + 1;
  }

  async enviarOC() {
    if (!this.archivoPDF || !this.centroCosto) return;

    const user = await this.auth.currentUser;
    const usuario = user?.email || 'Desconocido';
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

      await this.firestore.collection('ordenes_oc').add({
        id,
        centroCosto: this.centroCosto,
        destinoCompra: this.destinoCompra,
        estatus: 'Preaprobado',
        fechaSubida: firebase.firestore.Timestamp.fromDate(new Date()),
        nombrePDF: this.nombrePDF,
        archivoBase64: base64PDF,
        historial: [historialEntry]
      });

      const blob = this.base64ToBlob(base64PDF, 'application/pdf');
      const url = URL.createObjectURL(blob);
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

      this.historial.push(historialEntry);
      this.archivoPDF = null;
      this.centroCosto = '';
      alert('Orden subida con éxito.');
    };

    reader.readAsDataURL(this.archivoPDF);
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

}
