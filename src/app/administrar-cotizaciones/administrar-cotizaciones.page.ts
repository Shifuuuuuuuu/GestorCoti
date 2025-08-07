import { Component, OnInit } from '@angular/core';
import { AngularFirestore, QueryDocumentSnapshot } from '@angular/fire/compat/firestore';
import { AlertController, MenuController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { firstValueFrom } from 'rxjs';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
@Component({
  selector: 'app-administrar-cotizaciones',
  templateUrl: './administrar-cotizaciones.page.html',
  styleUrls: ['./administrar-cotizaciones.page.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class AdministrarCotizacionesPage implements OnInit {
  cargando: boolean = false;
  ocsFiltradas: any[] = [];
  busqueda: string = '';
  itemsPorPagina: number = 10;
  lastVisible: QueryDocumentSnapshot<any> | null = null;
  firstVisible: QueryDocumentSnapshot<any> | null = null;
  paginaActual: number = 1;
  historialPaginas: QueryDocumentSnapshot<any>[] = [];
  totalPaginas: number = 1;
  modo: 'listado' | 'busqueda' = 'listado';
  busquedaExacta: string = '';
  resultadoBusqueda: any = null;
  filtroEstatus: string = '';
  filtroCentroCosto: string = '';
  mostrarFiltros: boolean = false;
  filtroResponsable: string = '';
  responsables: string[] = [];
  cargandoEdicion: boolean = false;


  estadosDisponibles: string[] = [
    'Preaprobado',
    'Aprobado',
    'Rechazado',
    'OC enviada a proveedor',
    'Por Importación'
  ];
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
filtroUsuario: string = '';
filtroFecha: string = '';
usuariosDisponibles: string[] = [];

  constructor(
    private firestore: AngularFirestore,
    private alertController: AlertController,
    private menu: MenuController,
    private afAuth: AngularFireAuth
  ) {}

ngOnInit() {
  if (this.modo === 'listado') {
    this.cargarPagina();
  }

  this.cargarUsuarios();
}

// --- Helpers para limpiar payloads pesados de cada doc
private sanitizeOC(data: any) {
  const copia = { ...data };
  delete copia.archivosBase64;
  delete copia.archivosStorage;
  return copia;
}

// --- Arma la query de la página **actual** respetando paginación
// Cambia la firma para evitar el choque con unknown
private buildQueryDePaginaActual(
  ref: firebase.firestore.CollectionReference<any>,                // 👈
  direccion: 'actual' | 'adelante' | 'atras' = 'actual'
): firebase.firestore.Query<any> {                                  // 👈
  let q: firebase.firestore.Query<any> = ref.orderBy('id', 'desc').limit(this.itemsPorPagina);

  if (direccion === 'adelante' && this.lastVisible) {
    q = q.startAfter(this.lastVisible as firebase.firestore.QueryDocumentSnapshot<any>); // 👈 cast puntual
  }

  if (direccion === 'atras' && this.historialPaginas.length >= 2) {
    const anterior = this.historialPaginas[this.historialPaginas.length - 2];
    q = q.startAt(anterior as firebase.firestore.QueryDocumentSnapshot<any>);            // 👈 cast puntual
  }

  if (direccion === 'actual' && this.firstVisible) {
    q = q.startAt(this.firstVisible as firebase.firestore.QueryDocumentSnapshot<any>);   // 👈 cast puntual
  }

  return q;
}


// --- Hace merge por docId: agrega/quita/actualiza sin perder animaciones
private mergePorDocId(actual: any[], nuevos: any[]) {
  const mapaActual = new Map(actual.map(x => [x.docId, x]));
  const mapaNuevo  = new Map(nuevos.map(x => [x.docId, x]));

  // Actualiza o añade
  nuevos.forEach(n => {
    if (mapaActual.has(n.docId)) {
      const a = mapaActual.get(n.docId)!;
      Object.assign(a, n); // aplica cambios
    } else {
      actual.push(n); // nuevo en la página
    }
  });

  // Elimina los que ya no están en la página
  for (let i = actual.length - 1; i >= 0; i--) {
    if (!mapaNuevo.has(actual[i].docId)) {
      actual.splice(i, 1);
    }
  }
}

// --- Método público para el botón/ion-refresher
async recargarPaginaActual(ev?: CustomEvent) {
  try {
    this.cargando = true;

    const ref = this.firestore.collection('ordenes_oc').ref as firebase.firestore.CollectionReference; // compat
    const q = this.buildQueryDePaginaActual(ref, 'actual');
    const snap = await q.get(); // compat: devuelve QuerySnapshot

    if (!snap.empty) {
      const nuevos = snap.docs.map(doc => ({
        docId: doc.id,
        ...this.sanitizeOC(doc.data() as any)
      }));

      this.mergePorDocId(this.ocsFiltradas, nuevos);

      this.firstVisible = snap.docs[0];
      this.lastVisible  = snap.docs[snap.docs.length - 1];
    }
  } catch (e) {
    console.error('Error al recargar página actual:', e);
  } finally {
    this.cargando = false;
    if (ev) (ev.target as HTMLIonRefresherElement).complete();
  }
}


async editarCamposAdicionales(oc: any) {
  const alert = await this.alertController.create({
    header: 'Editar Campos Adicionales',
    inputs: [
      { name: 'centroCosto', type: 'text', placeholder: 'Centro de Costo', value: oc.centroCosto || '' },
      { name: 'centroCostoNombre', type: 'text', placeholder: 'Nombre del Centro de Costo', value: oc.centroCostoNombre || '' },
      { name: 'comentario', type: 'text', placeholder: 'Comentario', value: oc.comentario || '' },
      { name: 'destinoCompra', type: 'text', placeholder: 'Destino de Compra', value: oc.destinoCompra || '' },
      { name: 'aprobadorSugerido', type: 'text', placeholder: 'Aprobador Sugerido', value: oc.aprobadorSugerido || '' }
    ],
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Siguiente',
        handler: async (data) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'application/pdf,image/*';
          input.click();

          input.onchange = async () => {
            const archivo = input.files?.[0];
            let nuevoArchivo: any = null;

            if (archivo) {
              const filePath = `ordenes_oc/${oc.id}/archivo_actualizado_${Date.now()}_${archivo.name}`;
              const fileRef = firebase.storage().ref().child(filePath);
              await fileRef.put(archivo);
              const url = await fileRef.getDownloadURL();

              nuevoArchivo = {
                nombre: archivo.name,
                tipo: archivo.type,
                url: url
              };
            }

            const actualizaciones: any = {
              centroCosto: data.centroCosto ?? '',
              centroCostoNombre: data.centroCostoNombre ?? '',
              comentario: data.comentario ?? '',
              destinoCompra: data.destinoCompra ?? '',
              aprobadorSugerido: data.aprobadorSugerido ?? ''
            };

            // Si se subió archivo, lo agregamos al array archivosStorage
            if (nuevoArchivo) {
              const archivosExistentes = Array.isArray(oc.archivosStorage) ? oc.archivosStorage : [];
              actualizaciones.archivosStorage = [...archivosExistentes, nuevoArchivo];
            }

            try {
              await this.firestore.collection('ordenes_oc').doc(oc.docId).update(actualizaciones);
              this.buscarPorId(); // Refrescar si estás en modo búsqueda
            } catch (error) {
              console.error('Error actualizando campos:', error);
            }
          };
        }
      }
    ]
  });

  await alert.present();
}





async aplicarFiltros() {
  this.cargando = true;
  try {
    const queryRef = this.firestore.collection('ordenes_oc', ref => {
      let q: firebase.firestore.Query = ref.orderBy('fechaSubida', 'desc');

      if (this.filtroEstatus)   q = q.where('estatus', '==', this.filtroEstatus);
      if (this.filtroCentroCosto) q = q.where('centroCosto', '==', this.filtroCentroCosto);
      if (this.filtroUsuario)   q = q.where('usuario', '==', this.filtroUsuario);

      // Rango exacto del día
      if (this.filtroFecha) {
        const start = new Date(this.filtroFecha + 'T00:00:00');
        const end   = new Date(this.filtroFecha + 'T23:59:59.999');
        q = q.where('fechaSubida', '>=', start).where('fechaSubida', '<=', end);
      }

      return q;
    });

    const snapshot = await firstValueFrom(queryRef.get());

    const filtrados = snapshot.docs.map(doc => ({
      docId: doc.id,
      ...this.sanitizeOC(doc.data() as any)
    }));

    this.ocsFiltradas = filtrados.slice(0, this.itemsPorPagina);
    this.totalPaginas = Math.ceil(filtrados.length / this.itemsPorPagina);
    this.paginaActual = 1;
    this.firstVisible = snapshot.docs[0] ?? null;
    this.lastVisible  = snapshot.docs[Math.min(this.itemsPorPagina - 1, snapshot.docs.length - 1)] ?? null;
    this.historialPaginas = this.firstVisible ? [this.firstVisible] : [];
  } catch (error) {
    console.error('Error al aplicar filtros:', error);
  } finally {
    this.cargando = false;
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

cargarUsuarios() {
  this.firestore.collection('Usuarios').get().subscribe(snapshot => {
    this.usuariosDisponibles = snapshot.docs
      .map(doc => (doc.data() as any).fullName)
      .filter(nombre => !!nombre);
  });
}


limpiarFiltros() {
  this.filtroEstatus = '';
  this.filtroCentroCosto = '';
  this.irAlInicio();
}

irAlInicio() {
  this.paginaActual = 1;
  this.lastVisible = null;
  this.firstVisible = null;
  this.historialPaginas = [];
  this.cargarPagina(); // dirección por defecto: 'adelante'
}


async refrescarResultadoBusquedaActual() {
  if (!this.resultadoBusqueda?.docId) return;
  const doc = await this.firestore.collection('ordenes_oc').doc(this.resultadoBusqueda.docId).ref.get();
  if (doc.exists) {
    this.resultadoBusqueda = { docId: doc.id, ...this.sanitizeOC(doc.data() as any) };
  } else {
    this.resultadoBusqueda = null; // pudo haberse eliminado
  }
}

irAlFinal() {
  this.cargando = true;

  this.firestore.collection('ordenes_oc', ref =>
    ref.orderBy('id', 'desc')
  ).get().subscribe(snapshot => {
    const total = snapshot.size;
    const totalPaginas = Math.ceil(total / this.itemsPorPagina);

    const docs = snapshot.docs;
    const startDocIndex = (totalPaginas - 1) * this.itemsPorPagina;
    const startDoc = docs[startDocIndex];

    if (startDoc) {
      this.firestore.collection('ordenes_oc', ref =>
        ref.orderBy('id', 'desc')
          .startAt(startDoc)
          .limit(this.itemsPorPagina)
      ).get().subscribe(finalSnap => {
        this.ocsFiltradas = finalSnap.docs.map(doc => ({
          docId: doc.id,
          ...(doc.data() as any)
        }));

        this.firstVisible = finalSnap.docs[0];
        this.lastVisible = finalSnap.docs[finalSnap.docs.length - 1];
        this.historialPaginas = [this.firstVisible];
        this.paginaActual = totalPaginas;
        this.cargando = false;
      });
    } else {
      this.cargando = false;
    }
  });
}



async cargarPagina(direccion: 'adelante' | 'atras' = 'adelante') {
  this.cargando = true;
  try {
    const ref = this.firestore.collection('ordenes_oc').ref;
    const q = this.buildQueryDePaginaActual(ref, direccion);
    const snapshot = await q.get();

    if (!snapshot.empty) {
      this.ocsFiltradas = snapshot.docs.map(doc => ({
        docId: doc.id,
        ...this.sanitizeOC(doc.data() as any)
      }));

      this.firstVisible = snapshot.docs[0];
      this.lastVisible  = snapshot.docs[snapshot.docs.length - 1];

      if (direccion === 'adelante') {
        if (this.paginaActual > 1 || this.historialPaginas.length > 0) {
          this.paginaActual++;
        }
        this.historialPaginas.push(this.firstVisible);
      } else {
        this.historialPaginas.pop();
        this.paginaActual--;
      }
    }
  } catch (error) {
    console.error('Error al cargar página:', error);
  } finally {
    this.cargando = false;
  }
}



  buscarActualizado() {
    const b = this.busqueda.toLowerCase();
    this.ocsFiltradas = this.ocsFiltradas.filter(oc =>
      oc.id?.toString().includes(b) || oc.estatus?.toLowerCase().includes(b)
    );
  }

  paginaSiguiente() {
    this.cargarPagina('adelante');
  }

  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.cargarPagina('atras');
    }
  }

async buscarPorId() {
  const idBuscado = this.busquedaExacta.trim();
  const idNumerico = Number(idBuscado);
  if (isNaN(idNumerico)) {
    this.resultadoBusqueda = null;
    return;
  }

  this.cargando = true;

  try {
    const snapshot = await this.firestore.collection('ordenes_oc', ref =>
      ref.where('id', '==', idNumerico).limit(1)
    ).get().toPromise();

    if (snapshot && !snapshot.empty) {
      const doc = snapshot.docs[0];
      this.resultadoBusqueda = {
        docId: doc.id,
        ...(doc.data() as any)
      };
    } else {
      this.resultadoBusqueda = null;
    }
  } catch (error) {
    console.error('Error en buscarPorId():', error);
    this.resultadoBusqueda = null;
  } finally {
    this.cargando = false;
  }
}



async editarEstado(oc: any) {
  const alert = await this.alertController.create({
    header: `Cambiar estatus`,
    inputs: this.estadosDisponibles.map(estado => ({
      type: 'radio',
      label: estado,
      value: estado,
      checked: oc.estatus === estado
    })),
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Actualizar',
        handler: async (nuevoEstado) => {
          await this.firestore.collection('ordenes_oc').doc(oc.docId).update({ estatus: nuevoEstado });

          // Actualizar localmente
          const index = this.ocsFiltradas.findIndex(o => o.docId === oc.docId);
          if (index > -1) this.ocsFiltradas[index].estatus = nuevoEstado;
        }
      }
    ]
  });

  await alert.present();
}

async editarId(oc: any) {
  const alert = await this.alertController.create({
    header: 'Modificar ID',
    inputs: [{
      name: 'nuevoId',
      type: 'number',
      placeholder: 'Nuevo ID',
      value: oc.id
    }],
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Guardar',
        handler: async (data) => {
          const nuevoId = Number(data.nuevoId);
          if (!isNaN(nuevoId)) {
            await this.firestore.collection('ordenes_oc').doc(oc.docId).update({ id: nuevoId });
            this.cargarPagina('adelante');
          }
        }
      }
    ]
  });

  await alert.present();
}


async eliminarOC(oc: any) {
  const alert = await this.alertController.create({
    header: 'Eliminar OC',
    message: `¿Eliminar OC ID: ${oc.id}?`,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Eliminar',
        handler: async () => {
          await this.firestore.collection('ordenes_oc').doc(oc.docId).delete();

          // Quitar localmente
          this.ocsFiltradas = this.ocsFiltradas.filter(o => o.docId !== oc.docId);
        }
      }
    ]
  });

  await alert.present();
}


  getColorByStatus(estatus: string): string {
    switch (estatus) {
      case 'Aprobado': return '#28a745';
      case 'Rechazado': return '#dc3545';
      case 'Preaprobado': return '#ffc107';
      case 'OC enviada a proveedor': return '#17a2b8';
      case 'Por Importación': return '#6f42c1';
      default: return '#6c757d';
    }
  }

  ionViewWillEnter() {
    this.menu.enable(true);
  }
}
