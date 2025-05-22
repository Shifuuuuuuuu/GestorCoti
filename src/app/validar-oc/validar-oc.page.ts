import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-validar-oc',
  templateUrl: './validar-oc.page.html',
  styleUrls: ['./validar-oc.page.scss'],
})
export class ValidarOcPage implements OnInit {
  ocs: any[] = [];

  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.cargarOCs();
  }

cargarOCs() {
  this.firestore
    .collection('ordenes_oc', ref => ref.orderBy('fechaSubida', 'desc'))
    .snapshotChanges()
    .subscribe((snap) => {
      this.ocs = snap.map(doc => {
        const data = doc.payload.doc.data() as any;
        const pdfVistaUrl = data.archivoBase64
          ? this.crearPDFUrl(data.archivoBase64)
          : null;

        return {
          docId: doc.payload.doc.id,
          ...data,
          pdfVistaUrl,
          comentarioTemporal: ''
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
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  return this.sanitizer.bypassSecurityTrustResourceUrl(url);
}

async aprobarOC(oc: any) {
  const comentario = oc.comentarioTemporal?.trim();
  if (!comentario) {
    alert('Por favor escribe un comentario antes de aprobar.');
    return;
  }

  const user = await this.auth.currentUser;
  const usuario = user?.email || 'Desconocido';
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

  alert('OC aprobada con éxito.');
  this.cargarOCs();
}
async rechazarOC(oc: any) {
  const comentario = oc.comentarioTemporal?.trim();
  if (!comentario) {
    alert('Por favor escribe un comentario antes de rechazar.');
    return;
  }

  const user = await this.auth.currentUser;
  const usuario = user?.email || 'Desconocido';
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

  alert('OC rechazada con éxito.');
  this.cargarOCs();
}


}
