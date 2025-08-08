import { Component, OnInit } from '@angular/core';
import { AngularFirestore, QueryDocumentSnapshot } from '@angular/fire/compat/firestore';
import { AlertController, MenuController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { ModalController } from '@ionic/angular';
import { ModalSeleccionarOcPage } from '../modal-seleccionar-oc/modal-seleccionar-oc.page'; // ajusta si está en otra ruta
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

@Component({
  selector: 'app-administrar-solped',
  templateUrl: './administrar-solped.page.html',
  styleUrls: ['./administrar-solped.page.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class AdministrarSolpedPage implements OnInit {
  estadosItemDisponibles: string[] = ['pendiente', 'parcial', 'completo'];
  mostrarModalItems = false;
  itemsEditando: any[] = [];
  archivosNuevos: (File | null)[] = []; // un File por ítem a reemplazar
  indicePreviewRevocado: string[] = [];
  solpeds: any[] = [];
  solpedFiltrados: any[] = [];
  mostrarFiltros: boolean = false;
  busqueda: string = '';
  filtroCentro: string = '';
  filtroResponsable: string = '';
  filtroEstado: string = '';
  responsables: string[] = [];
  itemsPorPagina: number = 10;
  lastVisible: QueryDocumentSnapshot<any> | null = null;
  firstVisible: QueryDocumentSnapshot<any> | null = null;
  paginaActual: number = 0;
  historialPaginas: QueryDocumentSnapshot<any>[] = [];
  totalPaginas: number = 1;
  modo: 'listado' | 'busqueda' = 'listado';
  busquedaExacta: string = '';
  resultadoBusqueda: any = null;
  listaUsuarios: { id: string, fullName: string }[] = [];
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
  'GCIA. SERV. OBRA PAVIMENTACION RT CONTRATO FAM'
  ];
  mostrarModalEdicion = false;
  solpedEditando: any = null;

  estadosDisponibles: string[] = [
    'Solicitado', 'Completado', 'Cotizando', 'Rechazado'
  ];

  constructor(
    private firestore: AngularFirestore,
    private alertController: AlertController,
    private menu: MenuController,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.contarTotalPaginas();
    this.cargarPagina();
    this.cargarUsuarios();
  }

  contarTotalPaginas() {
    this.firestore.collection('solpes').get().subscribe(snapshot => {
      const total = snapshot.size;
      this.totalPaginas = Math.ceil(total / this.itemsPorPagina);
    });
  }
formatearCLP(valor: number): string {
  return valor?.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }) || '$0';
}

  cargarPagina(direccion: 'adelante' | 'atras' = 'adelante') {
    let query = this.firestore.collection('solpes', ref => {
      let q = ref.orderBy('numero_solpe', 'desc').limit(this.itemsPorPagina);
      if (direccion === 'adelante' && this.lastVisible) q = q.startAfter(this.lastVisible);
      if (direccion === 'atras' && this.historialPaginas.length >= 2) {
        const prev = this.historialPaginas[this.historialPaginas.length - 2];
        q = q.startAt(prev);
      }
      return q;
    });

    query.get().subscribe(snapshot => {
      if (!snapshot.empty) {
        this.solpedFiltrados = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any)
        }));

        this.firstVisible = snapshot.docs[0];
        this.lastVisible = snapshot.docs[snapshot.docs.length - 1];

        if (direccion === 'adelante') {
          if (this.paginaActual === 0 && this.historialPaginas.length === 0) {
            this.historialPaginas.push(this.firstVisible);
          } else if (this.paginaActual < this.totalPaginas - 1) {
            this.historialPaginas.push(this.firstVisible);
            this.paginaActual++;
          }
        } else if (direccion === 'atras' && this.historialPaginas.length > 1) {
          this.historialPaginas.pop();
          this.paginaActual--;
        }
      }
    });
  }

  paginaSiguiente() {
    if (this.paginaActual < this.totalPaginas - 1) this.cargarPagina('adelante');
  }

  paginaAnterior() {
    if (this.paginaActual > 0) this.cargarPagina('atras');
  }

  irAlInicio() {
    this.paginaActual = 1;
    this.lastVisible = null;
    this.historialPaginas = [];
    this.cargarPagina();
  }

  irAlFinal() {
    this.firestore.collection('solpes', ref => ref.orderBy('numero_solpe', 'desc')).get().subscribe(snapshot => {
      const total = snapshot.size;
      const totalPaginas = Math.ceil(total / this.itemsPorPagina);
      const docs = snapshot.docs;
      const startDoc = docs[(totalPaginas - 1) * this.itemsPorPagina];

      this.firestore.collection('solpes', ref =>
        ref.orderBy('numero_solpe', 'desc').startAt(startDoc).limit(this.itemsPorPagina)
      ).get().subscribe(lastSnap => {
        this.solpedFiltrados = lastSnap.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any)
        }));
        this.firstVisible = lastSnap.docs[0];
        this.lastVisible = lastSnap.docs[lastSnap.docs.length - 1];
        this.historialPaginas = [];
        this.paginaActual = totalPaginas - 1;
      });
    });
  }
async enlazarOC(solped: any) {
  const modal = await this.modalCtrl.create({
    component: ModalSeleccionarOcPage,
    componentProps: {
      numeroSolped: solped.numero_solpe,
      solpedId: solped.id
    }
  });

  await modal.present();
}




  buscarPorNumeroExacto() {
    const numero = Number(this.busquedaExacta.trim());
    if (isNaN(numero)) {
      this.resultadoBusqueda = null;
      return;
    }
    this.firestore.collection('solpes', ref =>
      ref.where('numero_solpe', '==', numero)
    ).get().subscribe(snapshot => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        this.resultadoBusqueda = {
          id: doc.id,
          ...(doc.data() as any)
        };
      } else {
        this.resultadoBusqueda = null;
      }
    });
  }

  async editarSolped(solped: any) {
    const alert = await this.alertController.create({
      header: `Cambiar estatus - SOLPED #${solped.numero_solpe}`,
      inputs: this.estadosDisponibles.map(estado => ({
        type: 'radio',
        label: estado,
        value: estado,
        checked: solped.estatus === estado
      })),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Actualizar',
          handler: async (nuevoEstado) => {
            const cambio = {
              fecha: new Date(),
              usuario: solped.usuario || 'admin',
              estatus: nuevoEstado
            };
            const historial = solped.historial || [];
            historial.push(cambio);
            await this.firestore.collection('solpes').doc(solped.id).update({
              estatus: nuevoEstado,
              historial
            });
            this.cargarPagina('adelante');
          }
        }
      ]
    });
    await alert.present();
  }

  async eliminarSolped(solped: any) {
    const alerta = await this.alertController.create({
      header: 'Eliminar',
      message: `¿Deseas eliminar la SOLPED #${solped.numero_solpe}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            await this.firestore.collection('solpes').doc(solped.id).delete();
            this.cargarPagina('adelante');
          }
        }
      ]
    });
    await alerta.present();
  }

  editarCompleto(solped: any) {
    if (!solped) return;
    this.solpedEditando = { ...solped };
    this.mostrarModalEdicion = true;
  }

  cerrarModalEdicion() {
    this.mostrarModalEdicion = false;
    this.solpedEditando = null;
  }

  async guardarCambiosEdicion() {
    if (!this.solpedEditando) return;

    const cambio = {
      fecha: new Date(),
      usuario: this.solpedEditando.usuario || 'admin',
      estatus: this.solpedEditando.estatus || 'Modificado'
    };
    const historial = this.solpedEditando.historial || [];
    historial.push(cambio);

    await this.firestore.collection('solpes').doc(this.solpedEditando.id).update({
      usuario: this.solpedEditando.usuario,
      numero_contrato: this.solpedEditando.numero_contrato,
      fecha: this.solpedEditando.fecha,
      estatus: this.solpedEditando.estatus,
      historial
    });

    this.mostrarModalEdicion = false;
    this.solpedEditando = null;

    if (this.modo === 'listado') {
      this.cargarSolpeds();
    } else if (this.modo === 'busqueda') {
      this.buscarPorNumeroExacto();
    }
  }

  getColorByStatus(estatus: string): string {
    switch (estatus) {
      case 'Aprobado': return '#28a745';
      case 'Rechazado': return '#dc3545';
      case 'Solicitado': return '#fd7e14';
      case 'Tránsito a Faena': return '#007bff';
      case 'Preaprobado': return '#ffc107';
      case 'OC enviada a proveedor': return '#17a2b8';
      case 'Por Importación': return '#6f42c1';
      default: return '#6c757d';
    }
  }

cambioModo() {
  if (this.modo === 'listado') {
    this.resultadoBusqueda = null;
    this.irAlInicio();
    if (this.mostrarFiltros) {
      this.filtrarSolpeds();
    } else {
      this.cargarPagina();
    }
  } else if (this.modo === 'busqueda') {
    this.busquedaExacta = '';
    this.resultadoBusqueda = null;
  }
}


  ionViewWillEnter() {
    this.menu.enable(true);
  }


filtrarSolpeds() {
  const textoBusqueda = this.busqueda.trim().toLowerCase();

  this.firestore.collection('solpes', ref => ref.orderBy('numero_solpe', 'desc')).get().subscribe(snapshot => {
    const todos = snapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data
      };
    });

    this.solpeds = todos;

    this.solpedFiltrados = todos.filter(s => {
      const fechaStr = s.fecha?.toDate ? s.fecha.toDate().toISOString().split('T')[0] : '';

      const coincideBusqueda =
        !textoBusqueda ||
        fechaStr.includes(textoBusqueda) ||
        (s.usuario || '').toLowerCase().includes(textoBusqueda);

      const coincideCentro = !this.filtroCentro || s.numero_contrato === this.filtroCentro;
      const coincideResponsable = !this.filtroResponsable || s.usuario === this.filtroResponsable;
      const coincideEstado = !this.filtroEstado || s.estatus === this.filtroEstado;

      return coincideBusqueda && coincideCentro && coincideResponsable && coincideEstado;
    });

    // También actualizamos la lista de responsables automáticamente
    this.responsables = [...new Set(this.solpeds.map(s => s.usuario).filter(r => !!r))];
  });
}

cargarUsuarios() {
  this.firestore.collection('Usuarios').get().subscribe(snapshot => {
    this.listaUsuarios = snapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        fullName: data.fullName
      };
    });

    this.responsables = this.listaUsuarios.map(u => u.fullName).filter(r => !!r);
  }, error => {
    console.error('Error al cargar usuarios:', error);
  });
}


limpiarFiltros() {
  this.filtroCentro = '';
  this.filtroEstado = '';
  this.filtroResponsable = '';
  this.busqueda = '';
  this.filtrarSolpeds();
}
abrirEditorItems(solped: any) {
  if (!solped) return;
  this.solpedEditando = { ...solped };
  this.itemsEditando = (solped.items || []).map((it: any) => ({ ...it }));
  this.archivosNuevos = this.itemsEditando.map(() => null);
  this.mostrarModalItems = true;
}
onFileChange(event: any, idx: number) {
  const file = event.target?.files?.[0];
  if (!file) return;
  this.archivosNuevos[idx] = file;

  // preview local opcional
  const localUrl = URL.createObjectURL(file);
  this.itemsEditando[idx].previewLocal = localUrl;
  this.indicePreviewRevocado.push(localUrl);
}
quitarImagen(idx: number) {
  this.itemsEditando[idx].imagenURL = '';
  this.archivosNuevos[idx] = null;
  this.itemsEditando[idx].previewLocal = '';
}
agregarItem() {
  this.itemsEditando.push({
    descripcion: '',
    cantidad: 0,
    cantidad_cotizada: 0,
    imagenURL: ''
  });
  this.archivosNuevos.push(null);
}
eliminarItem(idx: number) {
  this.itemsEditando.splice(idx, 1);
  this.archivosNuevos.splice(idx, 1);
}
async guardarItemsEditados() {
  if (!this.solpedEditando) return;
  const storage = getStorage();

  // Subir imágenes nuevas y normalizar números
  for (let i = 0; i < this.itemsEditando.length; i++) {
    const it = this.itemsEditando[i];

    // Asegura numéricos
    it.cantidad = Number(it.cantidad ?? 0);
    it.cantidad_cotizada = Number(it.cantidad_cotizada ?? 0);

    // Si hay imagen nueva, súbela y reemplaza imagenURL
    if (this.archivosNuevos[i]) {
      const file = this.archivosNuevos[i]!;
      const path = `solpes/${this.solpedEditando.id}/items/${i}_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      it.imagenURL = url;
      it.previewLocal = '';
    }
  }

  // Historial
  const cambio = {
    fecha: new Date(),
    usuario: this.solpedEditando.usuario || 'admin',
    estatus: 'Edición de ítems'
  };
  const historial = this.solpedEditando.historial || [];
  historial.push(cambio);

  // Persistir
  await this.firestore.collection('solpes').doc(this.solpedEditando.id).update({
    items: this.itemsEditando,
    historial
  });

  // Cierra modal, limpia y refresca
  this.mostrarModalItems = false;
  this.itemsEditando = [];
  this.archivosNuevos = [];
  this.indicePreviewRevocado.forEach(u => URL.revokeObjectURL(u));
  this.indicePreviewRevocado = [];
  this.solpedEditando = null;

  if (this.modo === 'listado') {
    this.cargarPagina(); // refresca la página actual
  } else {
    this.buscarPorNumeroExacto();
  }
}
  cargarSolpeds() {
    this.firestore.collection('solpes').snapshotChanges().subscribe(snapshot => {
      this.solpeds = snapshot.map(doc => {
        const data = doc.payload.doc.data() as any;
        return {
          id: doc.payload.doc.id,
          ...data
        };
      });
      this.responsables = [...new Set(this.solpeds.map(s => s.usuario).filter(r => !!r))];
      this.filtrarSolpeds();
    });
  }
}
