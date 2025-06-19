import { animate, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-historial-ordenes',
  templateUrl: './historial-ordenes.page.html',
  styleUrls: ['./historial-ordenes.page.scss'],
    animations: [
      trigger('fadeIn', [
        transition(':enter', [
          style({ opacity: 0 }),
          animate('400ms ease-in', style({ opacity: 1 }))
        ])
      ])
    ]
})
export class HistorialOrdenesPage implements OnInit {
  ocs: any[] = [];
  busquedaId: string = '';
  paginaActual: number = 1;
  itemsPorPagina: number = 10;
  lastVisible: any = null;
  firstVisible: any = null;
  historialPaginas: any[] = [];
  totalPaginas: number = 1;
  loadingInicial: boolean = true;
  modo: 'listado' | 'busqueda' = 'listado';

  constructor(
    private firestore: AngularFirestore,
    private sanitizer: DomSanitizer,
    private afAuth: AngularFireAuth
  ) {}

  ngOnInit() {
    if (this.modo === 'listado') {
      this.contarTotalPaginas();
      this.cargarPagina();
    }
  }

  contarTotalPaginas() {
    this.firestore.collection('ordenes_oc').get().subscribe(snapshot => {
      const total = snapshot.size;
      this.totalPaginas = Math.ceil(total / this.itemsPorPagina);
    });
  }

cargarPagina(direccion: 'adelante' | 'atras' = 'adelante') {
  this.loadingInicial = true;

  const query = this.firestore.collection('ordenes_oc', ref => {
    let q = ref.orderBy('fechaSubida', 'desc').limit(this.itemsPorPagina);
    if (direccion === 'adelante' && this.lastVisible) {
      q = q.startAfter(this.lastVisible);
    }
    if (direccion === 'atras' && this.historialPaginas.length >= 2) {
      const prev = this.historialPaginas[this.historialPaginas.length - 2];
      q = q.startAt(prev);
    }
    return q;
  });

  query.get().subscribe(snapshot => {
    const docsFiltrados = snapshot.docs.filter(doc => {
      const data = doc.data() as any;
      return data.estatus === 'Pendiente de Revisión' || data.estatus === 'Aprobado' || data.estatus === 'Rechazado';
    });
    this.ocs = docsFiltrados.map(doc => {
      const data = doc.data() as any;
      const fechaSubida = data.fechaSubida?.toDate?.() || data.fechaSubida || null;
      const historial = (data.historial || []).map((h: any) => ({
        ...h,
        fecha: h.fecha?.toDate?.() || h.fecha || null
      }));

      const esPDFCot = data.archivoBase64?.startsWith('JVBERi');
      const cotizacion = data.archivoBase64 ? {
        base64: data.archivoBase64,
        tipo: esPDFCot ? 'application/pdf' : 'image/jpeg',
        nombre: 'Cotización',
        url: null,
        mostrar: false
      } : null;

      const archivoOC = data.archivosPDF?.archivoBase64 || null;
      const nombreOC = data.archivosPDF?.nombrePDF || 'Orden de Compra';
      const esPDFOC = archivoOC?.startsWith('JVBERi');
      const ordenCompra = archivoOC ? {
        base64: archivoOC,
        tipo: esPDFOC ? 'application/pdf' : 'image/jpeg',
        nombre: nombreOC,
        url: null,
        mostrar: false
      } : null;

      return {
        ...data,
        docId: doc.id,
        fechaSubida,
        historial,
        cotizacion,
        ordenCompra
      };
    });

    if (!snapshot.empty && docsFiltrados.length > 0) {
      this.firstVisible = snapshot.docs[0];
      this.lastVisible = snapshot.docs[snapshot.docs.length - 1];

      if (direccion === 'adelante') {
        if (this.paginaActual === 1 && this.historialPaginas.length === 0) {
          this.historialPaginas.push(this.firstVisible);
        } else {
          this.historialPaginas.push(this.firstVisible);
          this.paginaActual++;
        }
      } else if (direccion === 'atras' && this.historialPaginas.length > 1) {
        this.historialPaginas.pop();
        this.paginaActual--;
      }
    } else if (direccion === 'adelante') {
      this.paginaActual--;
    }

    this.loadingInicial = false;
  });
}


  paginaSiguiente() {
    this.cargarPagina('adelante');
  }

  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.cargarPagina('atras');
    }
  }

  irAlInicio() {
    this.paginaActual = 1;
    this.lastVisible = null;
    this.historialPaginas = [];
    this.cargarPagina();
  }

  irAlFinal() {
    this.firestore.collection('ordenes_oc', ref => ref.orderBy('fechaSubida', 'desc')).get().subscribe(snapshot => {
      const total = snapshot.size;
      const totalPaginas = Math.ceil(total / this.itemsPorPagina);
      const docs = snapshot.docs;
      const startDoc = docs[(totalPaginas - 1) * this.itemsPorPagina];

      this.firestore.collection('ordenes_oc', ref =>
        ref.orderBy('fechaSubida', 'desc').startAt(startDoc).limit(this.itemsPorPagina)
      ).get().subscribe(lastSnap => {
        this.ocs = lastSnap.docs.map(doc => {
          const data = doc.data() as any;
          const fechaSubida = data.fechaSubida?.toDate?.() || null;
          return {
            ...data,
            docId: doc.id,
            fechaSubida
          };
        });

        this.firstVisible = lastSnap.docs[0];
        this.lastVisible = lastSnap.docs[lastSnap.docs.length - 1];
        this.historialPaginas = [];
        this.paginaActual = totalPaginas;
      });
    });
  }


buscarPorId() {
  const idBuscado = this.busquedaId.trim();
  const idNumerico = Number(idBuscado);

  if (isNaN(idNumerico)) {
    this.ocs = [];
    return;
  }

  this.loadingInicial = true;

  this.firestore.collection('ordenes_oc', ref =>
    ref.where('id', '==', idNumerico)
  ).get().subscribe(snapshot => {
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data() as any;

      const estatus = data.estatus;
      if (estatus === 'Pendiente de Revisión' || estatus === 'Aprobado' || estatus === 'Rechazado') {
        const fechaSubida = data.fechaSubida?.toDate?.() || data.fechaSubida || null;
        const historial = (data.historial || []).map((h: any) => ({
          ...h,
          fecha: h.fecha?.toDate?.() || h.fecha || null
        }));

        const esPDFCot = data.archivoBase64?.startsWith('JVBERi');
        const cotizacion = data.archivoBase64 ? {
          base64: data.archivoBase64,
          tipo: esPDFCot ? 'application/pdf' : 'image/jpeg',
          nombre: 'Cotización',
          url: null,
          mostrar: false
        } : null;

        const archivoOC = data.archivosPDF?.archivoBase64 || null;
        const nombreOC = data.archivosPDF?.nombrePDF || 'Orden de Compra';
        const esPDFOC = archivoOC?.startsWith('JVBERi');
        const ordenCompra = archivoOC ? {
          base64: archivoOC,
          tipo: esPDFOC ? 'application/pdf' : 'image/jpeg',
          nombre: nombreOC,
          url: null,
          mostrar: false
        } : null;

        this.ocs = [{
          ...data,
          docId: doc.id,
          fechaSubida,
          historial,
          cotizacion,
          ordenCompra
        }];
      } else {
        this.ocs = [];
      }
    } else {
      this.ocs = [];
    }

    this.loadingInicial = false;
  });
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
        this.irAlInicio();
      };

      reader.readAsDataURL(file);
    };

    input.click();
  }
cambioModo() {
  this.ocs = [];
  if (this.modo === 'listado') {
    this.busquedaId = '';
    this.contarTotalPaginas();
    this.irAlInicio();
  }
}

}
