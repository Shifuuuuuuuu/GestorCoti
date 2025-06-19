import { animate, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-gestor-ordenes',
  templateUrl: './gestor-ordenes.page.html',
  styleUrls: ['./gestor-ordenes.page.scss'],
    animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class GestorOrdenesPage implements OnInit {
  ordenes: any[] = [];
  ordenesFiltradas: any[] = [];
  busqueda: string = '';
  modo: 'listado' | 'busqueda' = 'listado';

  paginaActual: number = 1;
  itemsPorPagina: number = 5;
  totalPaginas: number = 1;
  loadingInicial: boolean = false;

  constructor(
    private firestore: AngularFirestore,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.obtenerOrdenesPendientes();
  }

  cambioModo() {
    if (this.modo === 'listado') {
      this.irAlInicio();
    } else {
      this.ordenesFiltradas = [];
    }
  }

  buscarPorId() {
    const texto = this.busqueda.trim();
    if (texto === '') {
      this.ordenesFiltradas = [];
      return;
    }

    this.ordenesFiltradas = this.ordenes.filter(o =>
      o.id?.toString().includes(texto)
    );
  }

  obtenerOrdenesPendientes() {
    this.loadingInicial = true;
    this.firestore.collection('ordenes_oc', ref =>
      ref.where('estatus', '==', 'Pendiente de Revisión')
    ).get().subscribe(snapshot => {
      this.ordenes = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        const fechaSubida = data.fechaSubida?.toDate?.() || null;

        const tipoCotizacion = this.normalizarTipoMime(data.tipoArchivo);
        const tipoAnexo = this.normalizarTipoMime(data.anexo?.tipo);

        const cotizacion = data.archivoBase64 ? {
          base64: data.archivoBase64,
          tipo: tipoCotizacion,
          nombre: data.nombrePDF || 'Cotización',
          mostrar: false,
          url: null
        } : null;

        const anexo = data.anexo?.archivoBase64 ? {
          base64: data.anexo.archivoBase64,
          tipo: tipoAnexo,
          nombre: data.anexo.nombre || 'Anexo',
          mostrar: false,
          url: null
        } : null;

        return {
          docId: doc.id,
          ...data,
          fechaSubida,
          cotizacion,
          anexo
        };
      }).sort((a, b) => b.fechaSubida - a.fechaSubida);

      this.totalPaginas = Math.ceil(this.ordenes.length / this.itemsPorPagina);
      this.irAlInicio();
      this.loadingInicial = false;
    });
  }

  normalizarTipoMime(tipo: string): string {
    switch (tipo?.toLowerCase()) {
      case 'pdf': return 'application/pdf';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      default: return tipo || 'application/pdf';
    }
  }

  mostrarArchivo(archivo: any) {
    if (!archivo.url && archivo.base64 && archivo.tipo) {
      archivo.url = this.crearArchivoUrl(archivo.base64, archivo.tipo);
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

  cambiarEstado(docId: string, nuevoEstado: 'Preaprobado' | 'Rechazado') {
    this.firestore.collection('ordenes_oc').doc(docId).update({
      estatus: nuevoEstado
    }).then(() => {
      this.ordenes = this.ordenes.filter(o => o.docId !== docId);
      this.filtrarOrdenes();
    });
  }

  actualizarPaginacion() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.ordenesFiltradas = this.ordenes.slice(inicio, fin);
  }

  paginaSiguiente() {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
      this.actualizarPaginacion();
    }
  }

  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.actualizarPaginacion();
    }
  }

  irAlInicio() {
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  irAlFinal() {
    this.paginaActual = this.totalPaginas;
    this.actualizarPaginacion();
  }

  trackById(index: number, item: any) {
    return item.docId || index;
  }

  filtrarOrdenes() {
    const texto = this.busqueda.trim();
    if (this.modo === 'listado' || texto === '') {
      this.actualizarPaginacion();
    } else {
      this.ordenesFiltradas = this.ordenes.filter(o =>
        o.id?.toString().includes(texto)
      );
    }
  }
}
