import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AngularFireAuth } from '@angular/fire/compat/auth';
@Component({
  selector: 'app-historial-oc',
  templateUrl: './historial-oc.page.html',
  styleUrls: ['./historial-oc.page.scss'],
})
export class HistorialOcPage implements OnInit {
  ocsOriginal: any[] = [];
  ocs: any[] = [];
  busquedaId: string = '';
  lastDoc: any = null;
  pageSize: number = 10;
  loadingMore: boolean = false;
  noMoreData: boolean = false;


  constructor(
    private firestore: AngularFirestore,
    private sanitizer: DomSanitizer,
    private afAuth: AngularFireAuth
  ) {}

  ngOnInit() {
    this.cargarHistorialOC();
  }

buscarPorId() {
  const busqueda = this.busquedaId.trim().toLowerCase();

  if (busqueda === '') {
    this.ocs = [...this.ocsOriginal];
  } else {
    this.ocs = this.ocsOriginal
      .filter(oc =>
        oc.id?.toString().toLowerCase() === busqueda ||
        oc.responsable?.toLowerCase().includes(busqueda)
      )
      .sort((a, b) => {
        const aExact = a.id?.toString().toLowerCase() === busqueda ? -1 : 1;
        const bExact = b.id?.toString().toLowerCase() === busqueda ? -1 : 1;
        return aExact - bExact;
      });
  }
}



async obtenerNombreUsuario(): Promise<string> {
  const user = await this.afAuth.currentUser;
  const uid = user?.uid;
  if (!uid) return 'Desconocido';

  try {
    const userDoc = await this.firestore.collection('Usuarios').doc(uid).get().toPromise();
    const data = userDoc?.data() as { fullName?: string };
    return data?.fullName || 'Desconocido';
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return 'Desconocido';
  }
}


cargarHistorialOC(reset: boolean = true) {
  if (reset) {
    this.ocs = [];
    this.ocsOriginal = [];
    this.lastDoc = null;
    this.noMoreData = false;
  }

  const query = this.firestore.collection('ordenes_oc', ref => {
    let q = ref.orderBy('fechaSubida', 'desc').limit(this.pageSize);
    if (this.lastDoc) {
      q = q.startAfter(this.lastDoc);
    }
    return q;
  });

  query.get().subscribe(snapshot => {
    const nuevos = snapshot.docs.map(doc => {
      const data = doc.data() as any;

      const esPDFCot = data.archivoBase64?.startsWith('JVBERi');
      const cotizacion = data.archivoBase64
        ? {
            base64: data.archivoBase64,
            tipo: esPDFCot ? 'application/pdf' : 'image/jpeg',
            nombre: 'Cotización',
            url: null,
            mostrar: false
          }
        : null;

      const archivoOC = data.archivosPDF?.archivoBase64 || null;
      const nombreOC = data.archivosPDF?.nombrePDF || 'Orden de Compra';
      const esPDFOC = archivoOC?.startsWith('JVBERi');
      const ordenCompra = archivoOC
        ? {
            base64: archivoOC,
            tipo: esPDFOC ? 'application/pdf' : 'image/jpeg',
            nombre: nombreOC,
            url: null,
            mostrar: false
          }
        : null;

      const fechaSubida = data.fechaSubida?.toDate?.() || data.fechaSubida || null;
      const historial = (data.historial || []).map((h: any) => ({
        ...h,
        fecha: h.fecha?.toDate?.() || h.fecha || null
      }));

      return {
        ...data,
        docId: doc.id,
        fechaSubida,
        historial,
        cotizacion,
        ordenCompra
      };
    });

    const nuevosFiltrados = nuevos.filter(nuevo =>
      !this.ocs.some(oc => oc.docId === nuevo.docId)
    );

    if (nuevosFiltrados.length < this.pageSize) {
      this.noMoreData = true;
    }

    this.lastDoc = snapshot.docs[snapshot.docs.length - 1];

    this.ocs = [...this.ocs, ...nuevosFiltrados];
    this.ocsOriginal = [...this.ocs];
  });
}



loadMore(event: any) {
  if (this.loadingMore || this.noMoreData) {
    event.target.disabled = true;
    return;
  }

  this.loadingMore = true;
  setTimeout(() => {
    this.cargarHistorialOC(false);
    this.loadingMore = false;
    event.target.complete();
  }, 600);
}


mostrarArchivo(archivo: any) {
  if (!archivo.url && archivo.base64 && archivo.tipo) {
    const url = this.crearArchivoUrl(archivo.base64, archivo.tipo);
    archivo.url = url;
  }
  archivo.mostrar = !archivo.mostrar;
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
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    const blob = new Blob(byteArrays, { type: tipo });
    return this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob));
  }
convertirFecha(fecha: any): Date {
  return fecha?.toDate ? fecha.toDate() : fecha;
}

  trackById(index: number, oc: any): string {
    return oc.docId;
  }
  async subirNuevaCotizacion(oc: any) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/pdf,image/*';

  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const fecha = new Date();

      const nombreUsuario = await this.obtenerNombreUsuario();
      const comentario = oc.comentarioNuevo?.trim() || 'Nueva cotización subida tras rechazo';

      const nuevoHistorial = {
        fecha: fecha,
        estatus: 'Preaprobado',
        usuario: nombreUsuario,
        comentario: comentario
      };

      await this.firestore.collection('ordenes_oc').doc(oc.docId).update({
        archivoBase64: base64,
        nombrePDF: file.name,
        fechaSubida: fecha,
        estatus: 'Preaprobado',
        historial: oc.historial ? [...oc.historial, nuevoHistorial] : [nuevoHistorial]
      });

      alert('Nueva cotización subida correctamente.');
      this.cargarHistorialOC(); // refresca la lista
    };


    reader.readAsDataURL(file);
  };

  input.click();
}

}
