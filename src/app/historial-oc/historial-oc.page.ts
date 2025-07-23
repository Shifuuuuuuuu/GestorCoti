import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import 'firebase/compat/firestore';
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
  this.irAlInicio();
}


contarTotalPaginas() {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const finMes = new Date(inicioMes);
  finMes.setMonth(inicioMes.getMonth() + 1);

  let query: firebase.firestore.Query = this.firestore.firestore.collection('ordenes_oc')
    .where('fechaSubida', '>=', inicioMes)
    .where('fechaSubida', '<', finMes);

  // ✅ Aplicar solo si hay un filtro por campo
  if (this.filtroEstado.length === 1) {
    query = query.where('estatus', '==', this.filtroEstado[0]);
  }
  if (this.filtroCentro.length === 1) {
    query = query.where('centroCosto', '==', this.filtroCentro[0]);
  }
  if (this.filtroResponsable.length === 1) {
    query = query.where('responsable', '==', this.filtroResponsable[0]);
  }

  query.get().then(snapshot => {
    const total = snapshot.size;
    this.totalPaginas = Math.max(1, Math.ceil(total / this.itemsPorPagina));
  }).catch(error => {
    console.error('❌ Error al contar total de páginas:', error);
    this.totalPaginas = 1;
  });
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
      .where('fechaSubida', '<', finMes)
      .orderBy('fechaSubida', 'desc')
      .limit(this.itemsPorPagina);

    // ✅ Aplicar filtros solo si hay uno por campo (los múltiples deben ir en memoria)
    if (this.filtroEstado.length === 1) {
      q = q.where('estatus', '==', this.filtroEstado[0]);
    }
    if (this.filtroCentro.length === 1) {
      q = q.where('centroCosto', '==', this.filtroCentro[0]);
    }
    if (this.filtroResponsable.length === 1) {
      q = q.where('responsable', '==', this.filtroResponsable[0]);
    }

    // ✅ Paginación
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


  convertirFechaFirestore(fecha: any): Date {
    return fecha?.toDate ? fecha.toDate() : fecha;
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

    const nombreUsuario = await this.obtenerNombreUsuario();
    const comentario = oc.comentarioNuevo?.trim() || 'Nueva cotización subida tras rechazo';

    const nuevoHistorial = {
      fecha: fecha,
      estatus: 'Revisión Guillermo',
      usuario: nombreUsuario,
      comentario: comentario
    };

    const docRef = this.firestore.collection('ordenes_oc').doc(oc.docId);

    try {
      // 🔥 1. Eliminar archivo anterior de Storage (si existe)
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

      // ⬆️ 2. Subir nuevo archivo a Firebase Storage
      const storagePath = `cotizaciones_oc/${oc.docId}/nueva_cot_${Date.now()}_${file.name}`;
      const fileRef = firebase.storage().ref().child(storagePath);
      await fileRef.put(file);
      const url = await fileRef.getDownloadURL();

      // 📄 3. Crear nuevo archivo
      const nuevoArchivo = {
        nombre: nombre,
        tipo: tipo,
        url: url,
        fecha: fecha,
        fechaEliminacion: new Date(Date.now() + 24 * 60 * 60 * 1000) // opcional
      };

      // 🔄 4. Guardar en Firestore
      await docRef.update({
        archivosStorage: [nuevoArchivo],
        estatus: 'Preaprobado',
        comentario: comentario,
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





cambioModo() {
  this.ocs = [];
  if (this.modo === 'listado') {
    this.busquedaId = '';
    this.contarTotalPaginas();
    this.irAlInicio();
  }
}

}
