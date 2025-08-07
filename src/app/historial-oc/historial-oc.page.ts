import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import 'firebase/compat/firestore';
import { ViewChild, AfterViewInit } from '@angular/core';
import { IonContent } from '@ionic/angular';
import {
  getFirestore,
  collection,
  query as q,
  where,
  orderBy,
  getCountFromServer,
} from 'firebase/firestore';

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
  @ViewChild(IonContent) content!: IonContent;
  viendoMesPasado = false;
  ocs: any[] = [];
  busquedaId: string = '';
  paginaActual: number = 1;
  itemsPorPagina: number = 5;
  lastVisible: any = null;
  firstVisible: any = null;
  historialPaginas: any[] = [];
  totalPaginas: number = 1;
  loadingInicial: boolean = true;
  modo: 'listado' | 'busqueda' = 'listado';
  filtroContrato: string = '';
  filtroDesde: string = '';
  filtroHasta: string = '';
  filtroCentro: string[] = [];
  filtroResponsable: string[] = [];
  filtroEstado: string[] = [];
  filtroFecha: string = '';
  mostrarFiltros: boolean = false;
  filtroComentario: string = '';
  hasNext = false;
  hasPrev = false;
  listaContratos: string[] = [
  'CONTRATO 27483 SUM. HORMIGON CHUCHICAMATA',
  'PLANTA PREDOSIFICADO CALAMA',
  'CONTRATO 20915 SUM. HORMIGON DAND',
  'CONTRATO 23302 CARPETAS',
  'CONTRATO 23302 AMPLIACION',
  'OFICINA LOS ANDES',
  'CASA MATRIZ',
  'RRHH',
  'FINANZAS',
  'SUSTENTABILIDAD',
  'SOPORTE TI',
  'STRIP CENTER',
  'PLANIFICACION',
  'PLANTA PREDOSIFICADO SAN BERNARDO',
  'PLANTA HORMIGON URB.SAN BERNARDO',
  'ALTO MAIPO',
  'PLANTA HORMIGON URB. RANCAGUA',
  'PLANTA ARIDOS RANCAGUA',
  'PLANTA ARIDOS SAN BERNARDO',
  'CONTRATO 22368 SUM HORMIGON DET',
  'CONTRATO 28662 CARPETAS',
  'CONTRATO 29207 MINERIA',
  'CONTRATO SUMINISTRO DE HORMIGONES DET',
  'CONTRATO SUMINISTRO DE HORMIGONES DAND',
  'CONTRATO MANTENCIÓN Y REPARACIÓN DE INFRAESTRUCTURA DAND',
  'CONTRATO REPARACIÓN DE CARPETAS DE RODADO DET',
  'SERVICIO PLANTA DE ÁRIDOS SAN JOAQUÍN',
  'SUMINISTRO DE HORMIGONES URBANOS SAN BERNARDO Y OLIVAR',
  'CONTRATO DE SUMINISTRO DE HORMIGONES CS',
  'CONTRATO HORMIGONES Y PREDOSIFICADO',
  'CONTRATO TALLER CANECHE',
  'CONTRATO INFRAESTRUCTURA DET',
  'CONTRATO CHUQUICAMATA',
  'CONTRATO CARPETAS DET',
  ];
  estadosDisponibles: string[] = ['Preaprobado', 'Rechazado', 'Aprobado', 'Enviada a proveedor','Revisión Guillermo','Casi Aprobado'];
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
  }

ngAfterViewInit() {
  this.content.ionScroll.subscribe(({ detail }) => {
    if (detail.deltaY > 10 && this.mostrarFiltros) {
      this.mostrarFiltros = false;
    }
  });
}
obtenerResponsablesYContratos() {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const finMes = new Date(inicioMes);
  finMes.setMonth(inicioMes.getMonth() + 1);

  this.firestore.collection('ordenes_oc', ref =>
    ref.where('fechaSubida', '>=', inicioMes)
       .where('fechaSubida', '<', finMes)
  ).get().subscribe(snapshot => {
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
private sanitizeOC(data: any) {
  const copia = { ...data };
  delete copia.archivosBase64;
  delete copia.archivosStorage;
  delete copia.historial; // ⚠ si el historial es grande, mejor no traerlo aquí
  return copia;
}

private rangoMesActual() {
  const inicio = new Date();
  inicio.setDate(1);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(inicio);
  fin.setMonth(inicio.getMonth() + 1);
  return { inicio, fin };
}

aplicarFiltros() {
  const hayFiltrosActivos = (
    this.filtroEstado.length > 0 ||
    this.filtroCentro.length > 0 ||
    this.filtroResponsable.length > 0 ||
    this.filtroFecha ||
    this.filtroComentario
  );

  if (!hayFiltrosActivos) {
    this.irAlInicio(); // usa la carga paginada normal
    return;
  }

  this.loadingInicial = true;

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const finMes = new Date(inicioMes);
  finMes.setMonth(inicioMes.getMonth() + 1);

  this.firestore.collection('ordenes_oc', ref =>
    ref.where('fechaSubida', '>=', inicioMes).where('fechaSubida', '<', finMes)
  ).get().subscribe(snapshot => {
    let docs = snapshot.docs.map(doc => {
      const data = doc.data() as any;
      const fechaSubida = this.convertirFechaFirestore(data.fechaSubida);
      return {
        ...data,
        docId: doc.id,
        fechaSubida,
        historial: (data.historial || []).map((h: any) => ({
          ...h,
          fecha: this.convertirFechaFirestore(h.fecha)
        })),
        archivosBase64: data.archivosBase64 || [],
        archivosVisuales: data.archivosStorage || []
      };
    });

    // 🔍 Aplicar filtros en memoria
    if (this.filtroEstado.length > 0) {
      docs = docs.filter(d => this.filtroEstado.includes(d.estatus));
    }
    if (this.filtroResponsable.length > 0) {
      docs = docs.filter(d => this.filtroResponsable.includes(d.responsable));
    }
    if (this.filtroCentro.length > 0) {
      docs = docs.filter(d => this.filtroCentro.includes(d.centroCosto));
    }
    if (this.filtroFecha) {
      const f = new Date(this.filtroFecha);
      docs = docs.filter(d => new Date(d.fechaSubida).toDateString() === f.toDateString());
    }
    if (this.filtroComentario) {
      const texto = this.filtroComentario.toLowerCase().trim();
      docs = docs.filter(d =>
        d.comentario?.toLowerCase().includes(texto) ||
        d.historial?.some((h: any) => h.comentario?.toLowerCase().includes(texto))
      );
    }

    docs.sort((a, b) => b.fechaSubida.getTime() - a.fechaSubida.getTime());

    this.ocs = docs;
    this.totalPaginas = 1; // cuando filtras, todo se carga de golpe
    this.paginaActual = 1;
    this.loadingInicial = false;
  });
}




limpiarFiltros() {
  this.filtroEstado = [];
  this.filtroCentro = [];
  this.filtroResponsable = [];
  this.filtroFecha = '';
  this.filtroComentario = '';
  this.viendoMesPasado = false;
  this.irAlInicio();
  this.contarTotalPaginas();
}
private buildQueryMesActual(ref: firebase.firestore.CollectionReference) {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const finMes = new Date(inicioMes);
  finMes.setMonth(inicioMes.getMonth() + 1);

  let q: firebase.firestore.Query = ref
    .where('fechaSubida', '>=', inicioMes)
    .where('fechaSubida', '<',  finMes)
    .orderBy('fechaSubida', 'desc');

  // MISMA REGLA que en cargarPagina: solo 1 valor por campo
  if (this.filtroEstado.length === 1)       q = q.where('estatus', '==', this.filtroEstado[0]);
  if (this.filtroCentro.length === 1)       q = q.where('centroCosto', '==', this.filtroCentro[0]);
  if (this.filtroResponsable.length === 1)  q = q.where('responsable', '==', this.filtroResponsable[0]);

  return q;
}


async contarTotalPaginas() {
  try {
    // No contamos en "mes pasado" ni cuando los filtros obligan a filtrar en memoria
    if (this.viendoMesPasado) { this.totalPaginas = 1; return; }

    const filtrosEnMemoria =
      this.filtroEstado.length > 1 ||
      this.filtroCentro.length > 1 ||
      this.filtroResponsable.length > 1 ||
      !!this.filtroComentario ||
      !!this.filtroFecha;

    if (filtrosEnMemoria) { this.totalPaginas = 1; return; }

    // Rango del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const finMes = new Date(inicioMes);
    finMes.setMonth(inicioMes.getMonth() + 1);

    // DB modular (usando la app de compat por debajo)
    const db = getFirestore(firebase.app());

    // MISMA query base que usas para paginar (mes actual)
    let qry = q(
      collection(db, 'ordenes_oc'),
      where('fechaSubida', '>=', inicioMes),
      where('fechaSubida', '<',  finMes),
      orderBy('fechaSubida', 'desc'),
    );

    // Mismos filtros "de servidor": solo 1 valor por campo
    if (this.filtroEstado.length === 1) {
      qry = q(qry, where('estatus', '==', this.filtroEstado[0]));
    }
    if (this.filtroCentro.length === 1) {
      qry = q(qry, where('centroCosto', '==', this.filtroCentro[0]));
    }
    if (this.filtroResponsable.length === 1) {
      qry = q(qry, where('responsable', '==', this.filtroResponsable[0]));
    }

    // ✅ Conteo en servidor (sin traer docs)
    const agg = await getCountFromServer(qry);
    const total = agg.data().count || 0;

    this.totalPaginas = Math.max(1, Math.ceil(total / this.itemsPorPagina));
  } catch (e) {
    console.error('❌ Error al contar total de páginas:', e);
    this.totalPaginas = 1;
  }
}





cargarPagina(direccion: 'adelante' | 'atras' = 'adelante') {
  this.loadingInicial = true;

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const finMes = new Date(inicioMes);
  finMes.setMonth(inicioMes.getMonth() + 1);

  const query = this.firestore.collection('ordenes_oc', ref => {
    let q = ref
      .where('fechaSubida', '>=', inicioMes)
      .where('fechaSubida', '<',  finMes)
      .orderBy('fechaSubida', 'desc')
      .limit(this.itemsPorPagina + 1); // <- para hasNext

    if (this.filtroEstado.length === 1)      q = q.where('estatus', '==', this.filtroEstado[0]);
    if (this.filtroCentro.length === 1)      q = q.where('centroCosto', '==', this.filtroCentro[0]);
    if (this.filtroResponsable.length === 1) q = q.where('responsable', '==', this.filtroResponsable[0]);

    // anclas de paginación
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
    const docs = snapshot.docs;

    // calcular navegación
    this.hasNext = docs.length > this.itemsPorPagina;
    const pageDocs = this.hasNext ? docs.slice(0, this.itemsPorPagina) : docs;

    // mapear data
    this.ocs = pageDocs.map(doc => {
      const data = doc.data() as any;
      return {
        ...data,
        docId: doc.id,
        fechaSubida: this.convertirFechaFirestore(data.fechaSubida),
        historial: (data.historial || []).map((h: any) => ({
          ...h,
          fecha: this.convertirFechaFirestore(h.fecha)
        })),
        archivosBase64: data.archivosBase64 || [],
        archivosVisuales: data.archivosStorage || []
      };
    });

    if (pageDocs.length) {
      this.firstVisible = pageDocs[0];
      this.lastVisible  = pageDocs[pageDocs.length - 1];

      if (direccion === 'adelante') {
        // primer render: historial vacío => no incrementar página
        if (this.historialPaginas.length === 0) {
          this.historialPaginas.push(this.firstVisible);
          this.paginaActual = 1; // explícito
        } else {
          this.historialPaginas.push(this.firstVisible);
          this.paginaActual++;
        }
      } else if (direccion === 'atras') {
        if (this.historialPaginas.length > 0) this.historialPaginas.pop();
        if (this.paginaActual > 1) this.paginaActual--;
      }
    } else {
      // sin resultados (p. ej., click en siguiente sin más páginas)
      this.hasNext = false;
    }

    this.hasPrev = this.paginaActual > 1;
    this.loadingInicial = false;
  }, _ => this.loadingInicial = false);
}





  convertirFechaFirestore(fecha: any): Date {
    return fecha?.toDate ? fecha.toDate() : fecha;
  }
recargarPaginaActual(ev?: CustomEvent) {
  this.loadingInicial = true;

  const { inicio, fin } = this.rangoMesActual();

  const query = this.firestore.collection('ordenes_oc', ref => {
    let q = ref
      .where('fechaSubida', '>=', inicio)
      .where('fechaSubida', '<', fin)
      .orderBy('fechaSubida', 'desc')
      .limit(this.itemsPorPagina + 1);

    if (this.filtroEstado.length === 1)      q = q.where('estatus', '==', this.filtroEstado[0]);
    if (this.filtroCentro.length === 1)      q = q.where('centroCosto', '==', this.filtroCentro[0]);
    if (this.filtroResponsable.length === 1) q = q.where('responsable', '==', this.filtroResponsable[0]);

    // misma ancla para reconstruir la página actual
    if (this.firstVisible) q = q.startAt(this.firstVisible);

    return q;
  });

  query.get().subscribe(snapshot => {
    const docs = snapshot.docs;
    this.hasNext = docs.length > this.itemsPorPagina;
    const pageDocs = this.hasNext ? docs.slice(0, this.itemsPorPagina) : docs;

    // 1) Construye versión "ligera" nueva
    const nuevos = pageDocs.map(doc => {
      const data = doc.data() as any;
      return {
        ...this.sanitizeOC(data),
        docId: doc.id,
        fechaSubida: this.convertirFechaFirestore(data.fechaSubida),
        // flags para visor (se conservan si ya existían; ver merge)
        mostrarArchivos: false,
        _archivosCargados: false,
        cargandoArchivos: false,
      };
    });

    // 2) MERGE con los existentes (conservar archivos si ya estaban cargados)
    const actualPorId = new Map(this.ocs.map(x => [x.docId, x]));
    const fusion: any[] = [];

    for (const n of nuevos) {
      const anterior = actualPorId.get(n.docId);
      if (anterior) {
        fusion.push({
          ...anterior,         // conserva archivos y flags si existen
          ...n,                // pisa con valores frescos (estatus, fecha, etc.)
          // conservar explícitamente adjuntos si ya estaban cargados
          archivosBase64: anterior.archivosBase64 ?? n.archivosBase64,
          archivosVisuales: anterior.archivosVisuales ?? n.archivosVisuales,
          mostrarArchivos: anterior.mostrarArchivos ?? false,
          _archivosCargados: anterior._archivosCargados ?? false,
          cargandoArchivos: false
        });
      } else {
        fusion.push(n);
      }
    }

    // 3) Reemplaza la lista por la fusionada
    this.ocs = fusion;

    // 4) Anclas
    if (pageDocs.length) {
      this.firstVisible = pageDocs[0];
      this.lastVisible  = pageDocs[pageDocs.length - 1];
    }

    this.hasPrev = this.paginaActual > 1;
    this.loadingInicial = false;
    if (ev) (ev.target as HTMLIonRefresherElement).complete();
  }, _ => {
    this.loadingInicial = false;
    if (ev) (ev.target as HTMLIonRefresherElement).complete();
  });
}

private resetNavegacion() {
  this.paginaActual = 1;
  this.hasPrev = false;
  this.hasNext = false;
  this.firstVisible = null;
  this.lastVisible = null;
  this.historialPaginas = [];
}


paginaSiguiente() { if (this.hasNext) this.cargarPagina('adelante'); }
paginaAnterior()  { if (this.hasPrev)  this.cargarPagina('atras'); }


irAlInicio() {
  this.resetNavegacion();
  this.cargarPagina('adelante');
}


irAlFinal() {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const finMes = new Date(inicioMes);
  finMes.setMonth(inicioMes.getMonth() + 1);

  const ref = this.firestore.firestore.collection('ordenes_oc')
    .where('fechaSubida', '>=', inicioMes)
    .where('fechaSubida', '<', finMes)
    .orderBy('fechaSubida', 'desc');

  ref.get().then(snapshot => {
    const total = snapshot.size;
    const totalPaginas = Math.ceil(total / this.itemsPorPagina);
    const docs = snapshot.docs;
    const startDoc = docs[(totalPaginas - 1) * this.itemsPorPagina];

    this.firestore.collection('ordenes_oc', subRef =>
      subRef
        .where('fechaSubida', '>=', inicioMes)
        .where('fechaSubida', '<', finMes)
        .orderBy('fechaSubida', 'desc')
        .startAt(startDoc)
        .limit(this.itemsPorPagina)
    ).get().subscribe(lastSnap => {
      this.ocs = lastSnap.docs.map(doc => {
        const data = doc.data() as any;
        const fechaSubida = this.convertirFechaFirestore(data.fechaSubida);
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

      const archivosBase64 = (data.archivosBase64 || []).map((archivo: any) => {
        const esPDF = archivo.base64?.startsWith('JVBERi');
        return {
          ...archivo,
          tipo: esPDF ? 'application/pdf' : 'image/jpeg',
          url: null,
          mostrar: false
        };
      });

      // ✅ archivosVisuales desde Storage con url segura
      const archivosVisuales = (data.archivosStorage || []).map((archivo: any, index: number) => {
        const tipo = archivo.tipo || 'application/pdf';
        return {
          nombre: archivo.nombre || `archivo_${index + 1}`,
          tipo,
          esPDF: tipo === 'application/pdf',
          esImagen: tipo.startsWith('image/'),
          url: this.sanitizer.bypassSecurityTrustResourceUrl(archivo.url),
          mostrar: false
        };
      });

      this.ocs = [{
        ...data,
        docId: doc.id,
        fechaSubida,
        historial,
        archivosBase64,
        archivosVisuales // 👈 importante
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


  // ✅ HTML LAZY LOAD
mostrarArchivoDesdeArray(archivo: any) {
  // Si no tiene tipo definido, lo calculamos (esto es lo que está faltando)
  if (!archivo.tipo && archivo.base64) {
    const esPDF = archivo.base64.startsWith('JVBERi');
    archivo.tipo = esPDF ? 'application/pdf' : 'image/jpeg';
  }

  // Si no tiene URL, la generamos
  if (!archivo.url && archivo.base64 && archivo.tipo) {
    const byteCharacters = atob(archivo.base64);
    const byteNumbers = Array.from(byteCharacters, c => c.charCodeAt(0));
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: archivo.tipo });
    const url = URL.createObjectURL(blob);
    archivo.url = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // Mostrar u ocultar
  archivo.mostrar = !archivo.mostrar;
}

cargarTodasLasCotizaciones() {
  this.loadingInicial = true;

  this.firestore.collection('ordenes_oc', ref =>
    ref.orderBy('fechaSubida', 'desc')
  ).get().subscribe(snapshot => {
    this.ocs = snapshot.docs.map((doc, index) => {
      const data = doc.data() as any;

      const fechaSubida = this.convertirFechaFirestore(data.fechaSubida);
      const historial = (data.historial || []).map((h: any) => ({
        ...h,
        fecha: this.convertirFechaFirestore(h.fecha)
      }));

      // ✅ Procesar archivosBase64 con tipo, url segura y control
      const archivosBase64 = Array.isArray(data.archivosBase64)
        ? data.archivosBase64.map((archivo: any) => {
            const esPDF = archivo.base64?.startsWith('JVBERi');
            const tipo = esPDF ? 'application/pdf' : 'image/jpeg';

            const byteCharacters = atob(archivo.base64);
            const byteNumbers = Array.from(byteCharacters, c => c.charCodeAt(0));
            const blob = new Blob([new Uint8Array(byteNumbers)], { type: tipo });
            const url = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob));

            return {
              ...archivo,
              tipo,
              url,
              esPDF,
              esImagen: tipo.startsWith('image/'),
              mostrar: false
            };
          })
        : [];

      // ✅ Procesar archivos de Storage con visual seguro
      const archivosVisuales = Array.isArray(data.archivosStorage)
        ? data.archivosStorage.map((archivo: any, i: number) => {
            const tipo = archivo.tipo || 'application/pdf';
            return {
              nombre: archivo.nombre || `archivo_${i + 1}`,
              tipo,
              esPDF: tipo === 'application/pdf',
              esImagen: tipo.startsWith('image/'),
              url: this.sanitizer.bypassSecurityTrustResourceUrl(archivo.url),
              mostrar: false
            };
          })
        : [];

      return {
        ...data,
        docId: doc.id,
        fechaSubida,
        historial,
        archivosBase64,
        archivosVisuales
      };
    });

    this.totalPaginas = 1;
    this.paginaActual = 1;
    this.loadingInicial = false;
  });
}



  // ✅ CONVERTIR URL SEGURA LAZY CARGA
mostrarArchivo(archivo: any) {
  // Tipo automático si no viene
  if (!archivo.tipo) {
    archivo.tipo = archivo.url?.includes('.pdf') ? 'application/pdf' : 'image/jpeg';
  }

  // Flags
  archivo.esPDF = archivo.tipo === 'application/pdf';
  archivo.esImagen = archivo.tipo.startsWith('image/');

  // ✅ SANITIZAR si no tiene url ya segura
  if (typeof archivo.url === 'string') {
    archivo.url = this.sanitizer.bypassSecurityTrustResourceUrl(archivo.url);
  }

  archivo.mostrar = !archivo.mostrar;
}


convertirURLSegura(url: string): SafeResourceUrl {
  return this.sanitizer.bypassSecurityTrustResourceUrl(url);
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

    const fecha = new Date();
    const tipo = file.type;
    const nombre = file.name;
    const comentario = oc.comentarioNuevo?.trim() || 'Nueva cotización subida tras rechazo';

    const nombreUsuario = await this.obtenerNombreUsuario();
    const monto = oc.nuevoMonto || oc.montoTotal || 0; // 👈 monto puede venir de input

    // 🧠 lógica de estatus
    let estatusFinal = 'Revisión Guillermo';
    if (nombreUsuario === 'Guillermo Manzor') {
      estatusFinal = monto <= 1000000 ? 'Aprobado' : 'Revisión Guillermo';
    } else if (nombreUsuario === 'Juan Cubillos') {
      estatusFinal = monto <= 5000000 ? 'Preaprobado' : 'Casi Aprobado';
    } else if (nombreUsuario === 'Alejandro Candia') {
      estatusFinal = 'Aprobado';
    }

    const nuevoHistorial = {
      fecha,
      estatus: estatusFinal,
      usuario: nombreUsuario,
      comentario
    };

    const docRef = this.firestore.collection('ordenes_oc').doc(oc.docId);

    try {
      // 1. Eliminar archivo anterior si existe
      const docSnap = await docRef.get().toPromise();
      const data = docSnap?.data() as any;
      if (Array.isArray(data.archivosStorage) && data.archivosStorage.length > 0) {
        const anterior = data.archivosStorage[0];
        const storageUrl = anterior.url;
        if (storageUrl) {
          const pathMatch = storageUrl.match(/\/o\/(.*?)\?alt=/);
          const path = pathMatch ? decodeURIComponent(pathMatch[1]) : null;
          if (path) {
            const storageRef = firebase.storage().ref().child(path);
            await storageRef.delete();
          }
        }
      }

      // 2. Subir nuevo archivo
      const storagePath = `cotizaciones_oc/${oc.docId}/nueva_cot_${Date.now()}_${file.name}`;
      const fileRef = firebase.storage().ref().child(storagePath);
      await fileRef.put(file);
      const url = await fileRef.getDownloadURL();

      const nuevoArchivo = {
        nombre,
        tipo,
        url,
        fecha,
        fechaEliminacion: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      // 3. Actualizar Firestore con nuevo archivo, monto y estatus
      await docRef.update({
        archivosStorage: [nuevoArchivo],
        estatus: estatusFinal,
        comentario,
        montoTotal: monto,
        fechaSubida: fecha,
        historial: firebase.firestore.FieldValue.arrayUnion(nuevoHistorial)
      });

      alert('✅ Nueva cotización subida correctamente.');
      this.irAlInicio();

    } catch (error) {
      console.error('❌ Error al subir nueva cotización:', error);
      alert('Ocurrió un error al subir el archivo.');
    }
  };

  input.click();
}

async enviarAclaracion(oc: any) {
  const comentario = oc.comentarioNuevo?.trim();
  if (!comentario) {
    alert('Por favor ingresa un comentario antes de enviar la aclaración.');
    return;
  }

  const nombreUsuario = await this.obtenerNombreUsuario();
  const fecha = new Date();


  let nuevoEstatus = oc.estatus === 'Pendiente de Aprobación' ? 'Revisión Guillermo' : oc.estatus;

  const nuevoHistorial = {
    usuario: nombreUsuario,
    estatus: nuevoEstatus,
    fecha,
    comentario
  };

  try {
    await this.firestore.collection('ordenes_oc').doc(oc.docId).update({
      comentario,
      estatus: nuevoEstatus,
      historial: firebase.firestore.FieldValue.arrayUnion(nuevoHistorial),
      fechaSubida: fecha
    });

    alert(`✅ Comentario enviado y estatus cambiado a "${nuevoEstatus}".`);
    this.irAlInicio();
  } catch (error) {
    console.error('❌ Error al enviar aclaración:', error);
    alert('Ocurrió un error al enviar la aclaración.');
  }
}

async cambiarPrecio(oc: any, nuevoMonto: number) {
  if (!nuevoMonto || nuevoMonto <= 0) {
    alert('El monto ingresado no es válido.');
    return;
  }

  if (oc.estatus !== 'Pendiente de Aprobación' && oc.estatus !== 'Rechazado') {
    alert('Solo se puede cambiar el precio cuando el estatus es Pendiente de Aprobación o Rechazado.');
    return;
  }

  const nombreUsuario = await this.obtenerNombreUsuario();
  const fecha = new Date();

  const nuevoHistorial = {
    usuario: nombreUsuario,
    estatus: oc.estatus,
    fecha,
    comentario: `Cambio de monto a ${nuevoMonto}`
  };

  try {
    await this.firestore.collection('ordenes_oc').doc(oc.docId).update({
      montoTotal: nuevoMonto,
      historial: firebase.firestore.FieldValue.arrayUnion(nuevoHistorial),
      fechaSubida: fecha
    });

    alert('✅ Precio actualizado correctamente.');
    this.irAlInicio();
  } catch (error) {
    console.error('❌ Error al cambiar precio:', error);
    alert('Ocurrió un error al actualizar el precio.');
  }
}
cargarCotizacionesMesAnterior(direccion: 'adelante' | 'atras' = 'adelante') {
  this.loadingInicial = true;

  // al entrar en este método, activamos el modo "mes pasado"
  this.viendoMesPasado = true;

  // si es la primera vez (no hay anclas), resetea paginación
  if (!this.firstVisible && !this.lastVisible && this.historialPaginas.length === 0) {
    this.paginaActual = 1;
  }

  // 📅 Rango del mes pasado
  const inicioMesPasado = new Date();
  inicioMesPasado.setMonth(inicioMesPasado.getMonth() - 1);
  inicioMesPasado.setDate(1);
  inicioMesPasado.setHours(0, 0, 0, 0);

  const finMesPasado = new Date(inicioMesPasado);
  finMesPasado.setMonth(inicioMesPasado.getMonth() + 1);

  const query = this.firestore.collection('ordenes_oc', ref => {
    let q = ref
      .where('fechaSubida', '>=', inicioMesPasado)
      .where('fechaSubida', '<',  finMesPasado)
      .orderBy('fechaSubida', 'desc')
      .limit(this.itemsPorPagina + 1); // detectar si hay siguiente

    // Paginación
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
    const docs = snapshot.docs;

    // ¿hay siguiente?
    this.hasNext = docs.length > this.itemsPorPagina;

    // Tomar los N visibles
    const pageDocs = this.hasNext ? docs.slice(0, this.itemsPorPagina) : docs;

    this.ocs = pageDocs.map(doc => {
      const data = doc.data() as any;

      // ---- Archivos de Storage (visuales)
      const archivosVisuales = Array.isArray(data.archivosStorage)
        ? data.archivosStorage.map((archivo: any, i: number) => {
            const tipo = archivo.tipo || 'application/pdf';
            const esPDF = tipo === 'application/pdf';
            const esImagen = tipo.startsWith('image/');
            const urlSegura = typeof archivo.url === 'string'
              ? this.sanitizer.bypassSecurityTrustResourceUrl(archivo.url)
              : archivo.url;

            return {
              nombre: archivo.nombre || `archivo_${i + 1}`,
              tipo,
              esPDF,
              esImagen,
              url: urlSegura,
              mostrar: false,
            };
          })
        : [];

    // ---- Base64 como placeholders (tu mostrarArchivoDesdeArray crea la URL al abrir)
      const archivosBase64 = Array.isArray(data.archivosBase64)
        ? data.archivosBase64.map((archivo: any, i: number) => ({
            ...archivo,
            nombre: archivo.nombre || `adjunto_${i + 1}`,
            url: null,
            mostrar: false,
          }))
        : [];

      return {
        ...data,
        docId: doc.id,
        fechaSubida: this.convertirFechaFirestore(data.fechaSubida),
        archivosVisuales,
        archivosBase64,
        // flags UI
        mostrarArchivos: false,
        _archivosCargados: true,
        cargandoArchivos: false,
      };
    });

    // Anclas
    if (pageDocs.length) {
      this.firstVisible = pageDocs[0];
      this.lastVisible  = pageDocs[pageDocs.length - 1];
    }

    // Historial/página
    if (direccion === 'adelante') {
      if (this.paginaActual > 1 || this.historialPaginas.length > 0) this.paginaActual++;
      if (this.firstVisible) this.historialPaginas.push(this.firstVisible);
    } else {
      if (this.historialPaginas.length > 0) this.historialPaginas.pop();
      if (this.paginaActual > 1) this.paginaActual--;
    }
    this.hasPrev = this.paginaActual > 1;

    // Evitamos conteo caro
    this.totalPaginas = 1;

    this.loadingInicial = false;
  }, _ => {
    this.loadingInicial = false;
  });
}

// 👇 botones para navegar/refrescar dentro del mes pasado
paginaSiguienteMesPasado() { if (this.hasNext) this.cargarCotizacionesMesAnterior('adelante'); }
paginaAnteriorMesPasado() { if (this.historialPaginas.length >= 2) this.cargarCotizacionesMesAnterior('atras'); }
recargarPaginaMesPasado()  {
  // reconstruye la misma página usando la ancla actual
  const keepFirst = this.firstVisible;
  const keepHist  = [...this.historialPaginas];
  const keepPage  = this.paginaActual;
  this.firstVisible = keepFirst;
  this.historialPaginas = keepHist;
  this.paginaActual = keepPage;
  this.cargarCotizacionesMesAnterior('adelante');
}

// 👇 salir del modo mes pasado y volver a mes actual
volverMesActual() {
  this.viendoMesPasado = false;
  this.resetNavegacion();
  this.cargarPagina('adelante');
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
