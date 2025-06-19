import { Component, OnInit } from '@angular/core';
import { AngularFirestore, QueryDocumentSnapshot } from '@angular/fire/compat/firestore';
import { AlertController, MenuController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { AngularFireAuth } from '@angular/fire/compat/auth';
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
    this.contarTotalPaginas();
    this.cargarPagina();
    this.cargarUsuarios();
  }
async editarCamposAdicionales(oc: any) {
  const alert = await this.alertController.create({
    header: 'Editar campos adicionales',
    inputs: [
      {
        name: 'centroCosto',
        type: 'text',
        placeholder: 'Centro de Costo',
        value: oc.centroCosto || ''
      },
      {
        name: 'centroCostoNombre',
        type: 'text',
        placeholder: 'Nombre del Centro de Costo',
        value: oc.centroCostoNombre || ''
      },
      {
        name: 'destinoCompra',
        type: 'text',
        placeholder: 'Destino de Compra',
        value: oc.destinoCompra || ''
      },
      {
        name: 'comentario',
        type: 'text',
        placeholder: 'Comentario',
        value: oc.comentario || ''
      }
    ],
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Guardar',
        handler: async (data) => {
          const actualizaciones: any = {
            centroCosto: data.centroCosto ?? '',
            centroCostoNombre: data.centroCostoNombre ?? '',
            destinoCompra: data.destinoCompra ?? '',
            comentario: data.comentario ?? ''
          };

          try {
            await this.firestore.collection('ordenes_oc').doc(oc.docId).update(actualizaciones);
            this.buscarPorId();
          } catch (error) {
            console.error('Error actualizando campos:', error);
          }
        }
      }
    ]
  });

  await alert.present();
}

aplicarFiltros() {
  const estatus = this.filtroEstatus.toLowerCase().trim();
  const centro = this.filtroCentroCosto.toLowerCase().trim();
  const usuario = this.filtroUsuario.toLowerCase().trim();
  const fechaFiltro = this.filtroFecha.trim();

  this.firestore.collection('ordenes_oc', ref => ref.orderBy('id', 'desc')).get().subscribe(snapshot => {
    const docs = snapshot.docs;
    const filtrados = docs
      .map(doc => {
        const data: any = doc.data();
        return {
          docId: doc.id,
          id: data.id,
          estatus: data.estatus,
          centroCosto: data.centroCosto,
          usuario: data.usuario || '',
          fechaSubida: data.fechaSubida
        };
      })
      .filter(oc => {
        const coincideEstatus = !estatus || (oc.estatus && oc.estatus.toLowerCase() === estatus);
        const coincideCentro = !centro || (oc.centroCosto && oc.centroCosto.toLowerCase().includes(centro));
        const coincideUsuario = !usuario || (oc.usuario && oc.usuario.toLowerCase().includes(usuario));
        const fechaString = oc.fechaSubida?.toDate?.().toISOString().split('T')[0] || '';
        const coincideFecha = !fechaFiltro || fechaString === fechaFiltro;

        return coincideEstatus && coincideCentro && coincideUsuario && coincideFecha;
      });

    this.ocsFiltradas = filtrados.slice(0, this.itemsPorPagina);
    this.paginaActual = 1;
    this.totalPaginas = Math.ceil(filtrados.length / this.itemsPorPagina);
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
  this.historialPaginas = [];
  this.cargarPagina();
}
contarTotalPaginas() {
  this.firestore.collection('ordenes_oc').get().subscribe(snapshot => {
    const total = snapshot.size;
    this.totalPaginas = Math.ceil(total / this.itemsPorPagina);
  });
}
irAlFinal() {
  this.firestore.collection('ordenes_oc', ref =>
    ref.orderBy('id', 'desc')
  ).get().subscribe(snapshot => {
    const total = snapshot.size;
    const totalPaginas = Math.ceil(total / this.itemsPorPagina);

    const docs = snapshot.docs;
    const startDoc = docs[(totalPaginas - 1) * this.itemsPorPagina];
    this.firestore.collection('ordenes_oc', ref =>
      ref.orderBy('id', 'desc').startAt(startDoc).limit(this.itemsPorPagina)
    ).get().subscribe(lastSnap => {
      this.ocsFiltradas = lastSnap.docs.map(doc => ({
        docId: doc.id,
        ...(doc.data() as any)
      }));

      this.firstVisible = lastSnap.docs[0];
      this.lastVisible = lastSnap.docs[lastSnap.docs.length - 1];
      this.historialPaginas = [];
      this.paginaActual = totalPaginas;
    });
  });
}


  cargarPagina(direccion: 'adelante' | 'atras' = 'adelante') {
    let query = this.firestore.collection('ordenes_oc', ref => {
      let q = ref.orderBy('id', 'desc').limit(this.itemsPorPagina);
      if (direccion === 'adelante' && this.lastVisible) q = q.startAfter(this.lastVisible);
      if (direccion === 'atras' && this.historialPaginas.length >= 2) {
        const prev = this.historialPaginas[this.historialPaginas.length - 2];
        q = q.startAt(prev);
      }
      return q;
    });

    query.get().subscribe(snapshot => {
      if (!snapshot.empty) {
        this.ocsFiltradas = snapshot.docs.map(doc => ({
          docId: doc.id,
          ...(doc.data() as any)
        }));

        this.firstVisible = snapshot.docs[0];
        this.lastVisible = snapshot.docs[snapshot.docs.length - 1];

        if (direccion === 'adelante') {
        if (this.paginaActual === 1 && this.historialPaginas.length === 0) {
            this.historialPaginas.push(this.firstVisible);
          } else {
            this.historialPaginas.push(this.firstVisible);
            this.paginaActual++;
          }
        }else if (direccion === 'atras' && this.historialPaginas.length > 1) {
          this.historialPaginas.pop();
          this.paginaActual--;
        }
      } else if (direccion === 'adelante') {
        this.paginaActual--;
      }
    });
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

  try {
    const snapshot = await this.firestore.collection('ordenes_oc', ref =>
      ref.where('id', '==', idNumerico)
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
            this.cargarPagina('adelante');
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
            this.cargarPagina('adelante');
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
