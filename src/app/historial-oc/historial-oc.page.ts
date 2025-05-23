import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-historial-oc',
  templateUrl: './historial-oc.page.html',
  styleUrls: ['./historial-oc.page.scss'],
})
export class HistorialOcPage implements OnInit {
  ocs: any[] = [];

  constructor(
    private firestore: AngularFirestore,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.cargarHistorialOC();
  }

  cargarHistorialOC() {
    this.firestore
      .collection('ordenes_oc')
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
        }).sort((a, b) => {
          const fechaA = a.fechaSubida?.toDate?.() || new Date(0);
          const fechaB = b.fechaSubida?.toDate?.() || new Date(0);
          return fechaB.getTime() - fechaA.getTime();
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
}
