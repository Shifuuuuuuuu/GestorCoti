import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { animate, style, transition, trigger } from '@angular/animations';
@Component({
  selector: 'app-historial-oc',
  templateUrl: './historial-oc.page.html',
  styleUrls: ['./historial-oc.page.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]

})
export class HistorialOcPage implements OnInit {
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
  filtroCentro: string = '';
  filtroResponsable: string = '';
  filtroContrato: string = '';
  filtroDesde: string = '';
  filtroHasta: string = '';
  filtroEstado: string = '';
  filtroFecha: string = '';
  mostrarFiltros: boolean = false;
  filtroComentario: string = '';

  listaContratos: string[] = [
    '10-10-12',
    '20-10-01',
    '30-10-01',
    '30-10-07',
    '30-10-08',
    '30-10-42',
    '30-10-43',
    '30-10-52',
    '30-10-53',
    '30-10-54',
    '30-10-57',
    '30-10-58',
    '30-10-59',
    '30-10-60',
    '30-10-61'
  ];
  estadosDisponibles: string[] = ['Preaprobado', 'Rechazado', 'Aprobado', 'Enviada a proveedor'];
responsables: string[] = [];
  constructor(
    private firestore: AngularFirestore,
    private sanitizer: DomSanitizer,
    private afAuth: AngularFireAuth
  ) {}

  ngOnInit() {
    if (this.modo === 'listado') {
      this.contarTotalPaginas();
      this.cargarPagina();
      this.obtenerResponsablesYContratos();
    }
  }obtenerResponsablesYContratos() {
  this.firestore.collection('ordenes_oc').get().subscribe(snapshot => {
    const responsablesSet = new Set<string>();
    const contratosSet = new Set<string>();

    snapshot.forEach(doc => {
      const data = doc.data() as any;
      if (data.responsable) responsablesSet.add(data.responsable);
      if (data.centroCosto) contratosSet.add(data.centroCosto);
    });

    this.responsables = Array.from(responsablesSet);
    this.listaContratos = Array.from(contratosSet);
  });
}

aplicarFiltros() {
  this.loadingInicial = true;

  this.firestore.collection('ordenes_oc').get().subscribe(snapshot => {
    let docs = snapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        ...data,
        docId: doc.id,
        fechaSubida: this.convertirFecha(data.fechaSubida)
      };
    });

    // 🔍 Aplicar filtros

    if (this.filtroEstado) {
      docs = docs.filter(d => d.estatus === this.filtroEstado);
    }

    if (this.filtroCentro) {
      docs = docs.filter(d => d.centroCosto === this.filtroCentro);
    }

    if (this.filtroResponsable) {
      docs = docs.filter(d => d.responsable === this.filtroResponsable);
    }

    if (this.filtroFecha) {
      const f = new Date(this.filtroFecha);
      docs = docs.filter(d => {
        const fecha = new Date(d.fechaSubida);
        return fecha.toDateString() === f.toDateString();
      });
    }

    if (this.filtroComentario) {
      const texto = this.filtroComentario.toLowerCase().trim();
      docs = docs.filter(d =>
        d.comentario?.toLowerCase().includes(texto) ||
        d.historial?.some((h: any) => h.comentario?.toLowerCase().includes(texto))
      );
    }

    // 👉 Ordenar de más reciente a más antiguo
    docs.sort((a, b) => b.fechaSubida.getTime() - a.fechaSubida.getTime());

    this.ocs = docs;
    this.totalPaginas = Math.ceil(this.ocs.length / this.itemsPorPagina);
    this.paginaActual = 1;
    this.loadingInicial = false;
  });
}



limpiarFiltros() {
  this.filtroEstado = '';
  this.filtroCentro = '';
  this.filtroResponsable = '';
  this.filtroFecha = '';
  this.irAlInicio();
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
    this.ocs = snapshot.docs.map(doc => {
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

      const archivosBase64 = (data.archivosBase64 || []).map((archivo: any) => {
        const esPDF = archivo.base64?.startsWith('JVBERi');
        return {
          ...archivo,
          tipo: esPDF ? 'application/pdf' : 'image/jpeg',
          url: null,
          mostrar: false
        };
      });

      return {
        ...data,
        docId: doc.id,
        fechaSubida,
        historial,
        cotizacion,
        ordenCompra,
        archivosBase64
      };
    });

    if (!snapshot.empty) {
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

      const archivosBase64 = (data.archivosBase64 || []).map((archivo: any) => {
        const esPDF = archivo.base64?.startsWith('JVBERi');
        return {
          ...archivo,
          tipo: esPDF ? 'application/pdf' : 'image/jpeg',
          url: null,
          mostrar: false
        };
      });

      this.ocs = [{
        ...data,
        docId: doc.id,
        fechaSubida,
        historial,
        cotizacion,
        ordenCompra,
        archivosBase64
      }];
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
mostrarArchivoDesdeArray(archivo: any) {
  if (!archivo.url && archivo.base64 && archivo.tipo) {
    const byteCharacters = atob(archivo.base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: archivo.tipo });
    const url = URL.createObjectURL(blob);
    archivo.url = this.sanitizer.bypassSecurityTrustResourceUrl(url);
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
      const tipo = file.type;
      const nombre = file.name;

      const nombreUsuario = await this.obtenerNombreUsuario();
      const comentario = oc.comentarioNuevo?.trim() || 'Nueva cotización subida tras rechazo';

      const nuevoHistorial = {
        fecha: fecha,
        estatus: 'Preaprobado',
        usuario: nombreUsuario,
        comentario: comentario
      };

      const nuevoArchivo = {
        base64: base64,
        nombre: nombre,
        fecha: fecha,
        tipo: tipo
      };

      // 🔄 Obtener datos actuales desde Firestore
      const docRef = this.firestore.collection('ordenes_oc').doc(oc.docId);
      const docSnap = await docRef.get().toPromise();
      const data = docSnap?.data() as any;

      const archivosPrevios = Array.isArray(data?.archivosBase64) ? data.archivosBase64 : [];
      const historialPrevio = Array.isArray(data?.historial) ? data.historial : [];

      // 🔎 Verificar si ya hay un archivo con el mismo nombre
      const yaExiste = archivosPrevios.some((a: any) => a.nombre === nombre);
      if (yaExiste) {
        alert(`Ya existe un archivo con el nombre "${nombre}". Cambia el nombre antes de subir.`);
        return;
      }

      // 🔥 Actualizar Firestore con el nuevo archivo
      await docRef.update({
        archivosBase64: [nuevoArchivo, ...archivosPrevios],
        estatus: 'Preaprobado',
        comentario: comentario,
        fechaSubida: fecha,
        historial: [...historialPrevio, nuevoHistorial]
      });

      alert('Nueva cotización subida correctamente.');
      this.irAlInicio(); // Refresca la vista
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
