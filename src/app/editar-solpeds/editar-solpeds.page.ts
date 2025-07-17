import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute } from '@angular/router';
import { AlertController, MenuController, ToastController } from '@ionic/angular';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {trigger,transition,style,animate} from '@angular/animations';
@Component({
  selector: 'app-editar-solpeds',
  templateUrl: './editar-solpeds.page.html',
  styleUrls: ['./editar-solpeds.page.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class EditarSolpedsPage implements OnInit {
  historialEstados: Array<{ fecha: any; estatus: string; usuario: string }> = [];
  archivoTemporalUrl: string | null = null;
  segmentoSeleccionado: string = 'historial';
  numeroBusqueda: number | undefined;
  solpeEncontrada: any = null;
  buscado: boolean = false;
  filtroContrato: string = '';
  solpeExpandidaId: string | null = null;
  filtroFecha: string = '';
  filtroEstatus: string = '';
  filtroResponsable: string = '';
  filtroUsuario: string = '';
  mostrarFiltros: boolean = false;
  solpe: any;
  solpes: any[] = [];
  solpedId: string = '';
  dataFacturaPDF: string = '';
  items: any[] = [];
  listaUsuarios: any[] = [];
  listaEstatus: string[] = ['Completado', 'Rechazado', 'Solicitado', 'Tránsito a Faena', 'Pre Aprobado'];
  solpesFiltradas: any[] = [];
  solpesOriginal: any[] = [];
  ordenAscendente: boolean = true;
  loading: boolean = true;
  ocsCargadas: { [solpeId: string]: any[] } = {};
  comentariosVistos: { [solpeId: string]: boolean } = {};
  userUid: string = '';
  filtroEmpresa: string = '';
  solpesAgrupadas: { [empresa: string]: any[] } = {};
  busquedaGeneral: string = '';

  constructor(
    private firestore: AngularFirestore,
    private menu: MenuController,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private toastController: ToastController,
    private cdRef: ChangeDetectorRef,
    private afAuth: AngularFireAuth
  ) {
      this.afAuth.user.subscribe(user => {
    if (user) this.userUid = user.uid;
  });
  }

  ngOnInit() {
    const solpeId = this.route.snapshot.paramMap.get('id');
    if (solpeId) {
      this.firestore.collection('solpes').doc(solpeId).get().subscribe(doc => {
        if (doc.exists) {
          this.solpe = doc.data();
          this.solpe.id = doc.id;
        }
      });
    }
    this.cargarSolpes();
    this.cargarUsuarios();
  this.cdRef.detectChanges();
  }
trackBySolpeId(index: number, solpe: any): string {
  return solpe.id;
}
  ionViewWillEnter() {
    this.menu.enable(true);
  }
  abrirInputOC(solpeId: string) {
    const input = document.getElementById(`ocInput-${solpeId}`) as HTMLInputElement;
    if (input) {
      input.click();
    }
  }
verOC(solpedId: string, archivoBase64: string) {
  if (!archivoBase64) {
    this.mostrarToast('El archivo está vacío o no se encontró.', 'danger');
    return;
  }

  const blob = this.base64ToBlob(archivoBase64, 'application/pdf');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
ordenarEmpresaGrupo = (a: any, b: any): number => {
  return a.key.localeCompare(b.key);
};
buscarPorReferencia() {
  const texto = this.busquedaGeneral?.toLowerCase().trim();

  if (!texto) {
    this.solpesFiltradas = [...this.solpesOriginal];
    this.solpesAgrupadas = this.agruparPorEmpresa(this.solpesFiltradas);
    return;
  }

  this.solpesFiltradas = this.solpesOriginal.filter(solpe => {
    const enNombre = solpe.nombre_solped?.toLowerCase().includes(texto);
    const enUsuario = solpe.usuario?.toLowerCase().includes(texto);
    const enItems = solpe.items?.some((item: any) =>
      item.descripcion?.toLowerCase().includes(texto) ||
      item.codigo_referencial?.toLowerCase().includes(texto) ||
      item.item?.toString().includes(texto)
    );

    return enNombre || enUsuario || enItems;
  });

  this.solpesAgrupadas = this.agruparPorEmpresa(this.solpesFiltradas);
}

formatearCLP(valor: number): string {
  return valor?.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }) || '$0';
}

async abrirImagenModal(imagenUrl: string) {
  const alert = await this.alertController.create({
    header: 'Imagen del Ítem',
    message: ' ', // 👈 espacio para que se renderice alert-message
    buttons: [
      {
        text: 'Cerrar',
        role: 'cancel',
        cssClass: 'alert-button-cerrar'
      }
    ],
    cssClass: 'custom-img-alert zoomable-alert',
    mode: 'ios',
    backdropDismiss: true
  });

  await alert.present();

  // Espera que el alert esté en el DOM
  setTimeout(() => {
    const alertEl = document.querySelector('ion-alert .alert-message');
    if (alertEl) {
      alertEl.innerHTML = `
        <div class="contenedor-img-zoom">
          <img src="${imagenUrl}" class="imagen-zoom" />
        </div>
      `;
    }
  }, 100);
}

toggleDetalle(solpeId: string) {
  this.solpeExpandidaId = this.solpeExpandidaId === solpeId ? null : solpeId;

  const solpe = this.solpes.find(s => s.id === solpeId);
  if (solpe && solpe.usuario_uid === this.userUid && !solpe.comentariosVistos?.[this.userUid]) {
    const updateData = { [`comentariosVistos.${this.userUid}`]: true };
    this.firestore.collection('solpes').doc(solpeId).update(updateData);
    solpe.comentariosVistos = { ...(solpe.comentariosVistos || {}), [this.userUid]: true };
  }

  this.firestore.collection('solpes').doc(solpeId).collection('ocs').get().subscribe(snapshot => {
    this.ocsCargadas[solpeId] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        nombre_centro_costo: data['nombre_centro_costo'] || '',
        numero_contrato: data['numero_contrato'] || '',
        fechaSubida: data['fechaSubida']?.toDate ? data['fechaSubida'].toDate() : (data['fechaSubida'] || null),

        fechaAprobacion: data['fechaAprobacion']?.toDate ? data['fechaAprobacion'].toDate() : (data['fechaAprobacion'] || null),
        destinoCompra: data['destinoCompra'] || '',
        comentario: data['comentario'] || '',
        items: Array.isArray(data['items']) ? data['items'] : [],
        archivoOC: data['archivoOC'] || null,
        archivosStorage: Array.isArray(data['archivosStorage']) ? data['archivosStorage'] : [],
        estatus: data['estatus'] || '',
        responsable: data['responsable'] || '',
      };
    });
    this.cdRef.detectChanges();
  }, error => {
    console.error('❌ Error al cargar OCs:', error);
  });
}


buscarSolpe(modo: 'buscar' | 'estados' = 'buscar') {
  this.firestore
    .collection('solpes', ref => ref.where('numero_solpe', '==', this.numeroBusqueda))
    .get()
    .subscribe(snapshot => {
      this.buscado = true;

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data() as any;
        this.solpeEncontrada = { id: doc.id, ...data };

        if (modo === 'estados') {
          this.cargarHistorialEstados(doc.id);
        }
      } else {
        this.solpeEncontrada = null;
        this.historialEstados = [];
      }
    });
}
cargarHistorialEstados(solpeId: string) {
  this.firestore
    .collection('solpes')
    .doc(solpeId)
    .collection('historialEstados', ref => ref.orderBy('fecha', 'asc'))
    .get()
    .subscribe(snapshot => {
      this.historialEstados = snapshot.docs.map(doc => {
        const d: any = doc.data();
        let fechaDate: Date;
        if (d.fecha?.toDate) {
          fechaDate = d.fecha.toDate();
        } else {
          fechaDate = new Date(d.fecha);
        }
        return {
          fecha: fechaDate,
          estatus: d.estatus,
          usuario: d.usuario
        };
      });
    }, error => {
      console.error('Error cargando historial de estados:', error);
      this.historialEstados = [];
    });
}


cargarSolpes() {
  this.firestore
    .collection('solpes', ref => ref.orderBy('numero_solpe', 'desc'))
    .get()
    .subscribe(snapshot => {
      const solpesTemp: any[] = [];
      snapshot.docs.forEach((doc: any) => {
        const solpe = doc.data();
        solpe.id = doc.id;
        solpe.comentarios = solpe.comentarios || [];
        solpesTemp.push(solpe);
      });

      this.solpesOriginal = solpesTemp;
      this.solpesFiltradas = [...this.solpesOriginal];

      // ✅ Agrupar por empresa aquí
      this.solpesAgrupadas = this.agruparPorEmpresa(this.solpesFiltradas);

      this.loading = false;
    });
}


  cargarUsuarios() {
    this.firestore.collection('Usuarios').get().subscribe(snapshot => {
      this.listaUsuarios = snapshot.docs.map(doc => {
        const data = doc.data() as { fullName: string };
        return {
          id: doc.id,
          fullName: data.fullName
        };
      });
    }, error => {
      console.error('Error recuperando usuarios:', error);
    });
  }
filtrarSolpes() {
  const normalize = (str: string) => str?.toLowerCase().trim();

  this.solpesFiltradas = this.solpesOriginal.filter(solpe => {
    let fechaSolpe = '';

    if (solpe.fecha) {
      try {
        if (typeof solpe.fecha === 'string' && solpe.fecha.includes('/')) {
          const partes = solpe.fecha.split('/');
          if (partes.length === 3) {
            fechaSolpe = `${partes[2]}-${partes[1]}-${partes[0]}`;
          }
        } else if (solpe.fecha.toDate) {
          const d = solpe.fecha.toDate();
          fechaSolpe = d.toISOString().slice(0, 10);
        }
      } catch (error) {
        console.error('Error procesando la fecha:', error);
        fechaSolpe = '';
      }
    }

    const coincideFecha = this.filtroFecha ? fechaSolpe === this.filtroFecha : true;
    const coincideEstatus = this.filtroEstatus ? normalize(solpe.estatus) === normalize(this.filtroEstatus) : true;
    const coincideUsuario = this.filtroUsuario
      ? normalize(solpe.usuario || '') === normalize(this.filtroUsuario)
      : true;
    const coincideContrato = this.filtroContrato
      ? solpe.numero_contrato === this.filtroContrato
      : true;

    const coincideEmpresa = this.filtroEmpresa
      ? normalize(solpe.empresa || '') === normalize(this.filtroEmpresa)
      : true;

    return coincideFecha && coincideEstatus && coincideUsuario && coincideContrato && coincideEmpresa;
  });
  this.solpesAgrupadas = this.agruparPorEmpresa(this.solpesFiltradas);
  this.solpeExpandidaId = null;
}

agruparPorEmpresa(solpes: any[]): { [empresa: string]: any[] } {
  const agrupadas: { [empresa: string]: any[] } = {};
  for (const solpe of solpes) {
    const empresa = solpe.empresa || 'Sin Empresa';
    if (!agrupadas[empresa]) agrupadas[empresa] = [];
    agrupadas[empresa].push(solpe);
  }
  return agrupadas;
}



  ordenarSolpes() {
    this.ordenAscendente = !this.ordenAscendente;
    this.solpesFiltradas.sort((a, b) => {
      return this.ordenAscendente
        ? a.numero_solpe - b.numero_solpe
        : b.numero_solpe - a.numero_solpe;
    });
  }

  limpiarFiltros() {
    this.filtroFecha = '';
    this.filtroEstatus = '';
    this.filtroResponsable = '';
    this.filtroUsuario = '';
    this.solpesFiltradas = [...this.solpesOriginal];
  }

  getColorByStatus(estatus: string) {
    switch (estatus) {
      case 'Completado':
        return '#28a745';
      case 'Rechazado':
        return '#dc3545';
      case 'Solicitado':
        return '#fd7e14';
      case 'Tránsito a Faena':
        return '#007bff';
      case 'Preaprobado':
        return '#ffc107';
      case 'OC enviada a proveedor':
        return '#17a2b8';
      case 'Por Importación':
        return '#6f42c1';
      default:
        return '#6c757d';
    }
  }

getBadgeColor(estatus: string): string {
  const estado = estatus?.toLowerCase() || '';
  switch (estado) {
    case 'pendiente':
      return '#ffc107'; // Amarillo
    case 'aprobado':
    case 'completado':
      return '#28a745'; // Verde
    case 'rechazado':
      return '#dc3545'; // Rojo
    case 'solicitado':
      return '#fd7e14'; // Naranja
    case 'tránsito a faena':
      return '#007bff'; // Azul
    case 'preaprobado':
      return '#6c757d'; // Gris oscuro
    default:
      return '#6c757d'; // Gris por defecto
  }
}

verOCDesdeSolped(solpedId: string, ocId: string, tipoArchivo: 'cotizacion' | 'oc') {
  if (!solpedId || !ocId) {
    this.mostrarToast('IDs inválidos para buscar OC.', 'danger');
    return;
  }

  const ocRef = this.firestore.collection('solpes').doc(solpedId).collection('ocs').doc(ocId);

  ocRef.get().subscribe(docSnapshot => {
    if (!docSnapshot.exists) {
      this.mostrarToast('OC no encontrada en esta SOLPED.', 'danger');
      return;
    }

    const data = docSnapshot.data() as any;

    if (tipoArchivo === 'cotizacion') {
      const archivoOC = data['archivoOC'];
      if (archivoOC?.url) {
        window.open(archivoOC.url, '_blank');
      } else {
        this.mostrarToast('No se encontró la cotización.', 'danger');
      }
    }

    if (tipoArchivo === 'oc') {
      const archivosStorage = Array.isArray(data['archivosStorage']) ? data['archivosStorage'] : [];

      if (archivosStorage.length === 0) {
        this.mostrarToast('No hay archivos OC en Storage.', 'danger');
        return;
      }

      // Si hay solo uno, abrirlo directo
      if (archivosStorage.length === 1) {
        window.open(archivosStorage[0].url, '_blank');
      } else {
        // Si hay varios, abrir todos en nuevas pestañas
        archivosStorage.forEach((archivo: any) => {
          if (archivo?.url) window.open(archivo.url, '_blank');
        });
      }
    }
  }, error => {
    console.error('Error al obtener OC:', error);
    this.mostrarToast('Error al cargar archivos de la OC.', 'danger');
  });
}


abrirArchivoEnNuevaVentana(url: string, nombre: string) {
  const ventana = window.open();
  if (ventana) {
    ventana.document.title = nombre;
    ventana.document.write(`
      <html>
        <head>
          <title>${nombre}</title>
          <style>
            body { margin: 0; font-family: sans-serif; }
            h2 { margin: 10px; text-align: center; color: #333; }
            iframe { width: 100%; height: calc(100% - 50px); border: none; }
          </style>
        </head>
        <body>
          <h2>${nombre}</h2>
          <iframe src="${url}"></iframe>
        </body>
      </html>
    `);
  }
}


crearArchivoUrl(base64: string, tipo: string): string {
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
  return URL.createObjectURL(blob);
}
puedeEditarCantidad(fechaCreacion: any): boolean {
  try {
    let fecha: Date;
    if (fechaCreacion?.toDate) {
      fecha = fechaCreacion.toDate(); // Timestamp de Firestore
    } else {
      fecha = new Date(fechaCreacion); // String ISO o similar
    }

    const ahora = new Date();
    const diferenciaMs = ahora.getTime() - fecha.getTime();
    const horasPasadas = diferenciaMs / (1000 * 60 * 60);

    return horasPasadas <= 24;
  } catch (error) {
    console.error('Error evaluando fecha de edición:', error);
    return false;
  }
}

async editarItem(solpeId: string, item: any) {
  const alert = await this.alertController.create({
    header: `Editar ítem ${item.item}`,
    inputs: [
      {
        name: 'nuevaCantidad',
        type: 'number',
        placeholder: 'Nueva cantidad',
        value: item.cantidad
      },
      {
        name: 'nuevaDescripcion',
        type: 'textarea',
        placeholder: 'Nueva descripción',
        value: item.descripcion
      }
    ],
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Guardar',
        handler: async (data) => {
          const nuevaCantidad = Number(data.nuevaCantidad);
          const nuevaDescripcion = data.nuevaDescripcion?.trim();

          if (isNaN(nuevaCantidad) || nuevaCantidad <= 0) {
            this.mostrarToast('Cantidad inválida.', 'danger');
            return false;
          }

          try {
            const solpeRef = this.firestore.collection('solpes').doc(solpeId);
            const solpeSnap = await solpeRef.get().toPromise();
            if (!solpeSnap?.exists) return;

            const solpeData = solpeSnap.data() as any;
            const items = solpeData.items || [];
            const idx = items.findIndex((i: any) => i.item === item.item);
            if (idx === -1) return;

            items[idx].cantidad = nuevaCantidad;
            items[idx].descripcion = nuevaDescripcion;

            await solpeRef.update({ items });

            // Actualiza en la UI
            item.cantidad = nuevaCantidad;
            item.descripcion = nuevaDescripcion;
            this.cdRef.detectChanges();

            this.mostrarToast('Ítem actualizado correctamente.', 'success');
          } catch (err) {
            console.error(err);
            this.mostrarToast('Error al actualizar ítem.', 'danger');
          }

          return true;
        }
      }
    ]
  });

  await alert.present();
}
tieneComentariosRecientes(comentarios: any[]): boolean {
  if (!comentarios || comentarios.length === 0) return false;
  const ahora = new Date();
  return comentarios.some(c => {
    const fecha = c.fecha?.toDate ? c.fecha.toDate() : new Date(c.fecha);
    const horas = (ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60);
    return horas <= 24;
  });
}

async confirmarEliminacionItem(solpeId: string, item: any) {
  const alert = await this.alertController.create({
    header: `Eliminar ítem ${item.item}`,
    inputs: [
      {
        name: 'justificacion',
        type: 'textarea',
        placeholder: 'Justifica por qué se elimina este ítem'
      }
    ],
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Eliminar',
        handler: async (data) => {
          const justificacion = data.justificacion?.trim();
          if (!justificacion) {
            this.mostrarToast('Debes ingresar una justificación.', 'danger');
            return false;
          }

          await this.eliminarItemConJustificacion(solpeId, item, justificacion);
          return true;
        }
      }
    ]
  });

  await alert.present();
}
async eliminarItemConJustificacion(solpeId: string, item: any, justificacion: string) {
  const usuario = await this.obtenerNombreUsuario();
  const solpeRef = this.firestore.collection('solpes').doc(solpeId);

  try {
    const solpeSnap = await solpeRef.get().toPromise();
    if (!solpeSnap?.exists) throw new Error('SOLPED no encontrada');

    const solpeData = solpeSnap.data() as any;
    const items = solpeData.items || [];

    const nuevosItems = items.filter((i: any) => i.item !== item.item);
    const comentarios = solpeData.comentarios || [];

    const comentarioTexto = `🗑 Ítem ${item.item} eliminado. Justificación: ${justificacion}`;

    // ➕ Agregar al arreglo de comentarios
    comentarios.push({
      texto: comentarioTexto,
      fecha: new Date(),
      usuario: usuario
    });

    // 🔄 Actualizar los ítems y comentarios en Firestore
    await solpeRef.update({ items: nuevosItems, comentarios });

    // ✅ También agregar al historialEstados
    await solpeRef.collection('historialEstados').add({
      fecha: new Date(),
      estatus: 'Ítem eliminado',
      usuario: usuario,
      descripcion: comentarioTexto
    });

    // 🔄 Actualizar en la UI
    const solpeUI = this.solpesFiltradas.find(s => s.id === solpeId);
    if (solpeUI) {
      solpeUI.items = nuevosItems;
      solpeUI.comentarios = comentarios;
    }

    this.cdRef.detectChanges();
    this.mostrarToast('Ítem eliminado y registrado en historial', 'success');
  } catch (err) {
    console.error('Error al eliminar ítem:', err);
    this.mostrarToast('No se pudo eliminar el ítem', 'danger');
  }
}


async agregarComentario(solpe: any) {
  const texto = (solpe.nuevoComentario || '').trim();
  if (!texto) {
    this.mostrarToast('Debes ingresar un comentario.', 'danger');
    return;
  }

  const usuario = await this.obtenerNombreUsuario();

  const nuevoComentario = {
    texto: texto,
    fecha: new Date(),
    usuario: usuario
  };

  try {
    const solpeRef = this.firestore.collection('solpes').doc(solpe.id);
    const solpeSnap = await solpeRef.get().toPromise();
    if (!solpeSnap?.exists) {
      throw new Error('SOLPED no encontrada');
    }

    const solpeData = solpeSnap.data() as any;
    const comentariosActuales = solpeData.comentarios || [];

    comentariosActuales.push(nuevoComentario);
    await solpeRef.update({ comentarios: comentariosActuales });

    solpe.comentarios = comentariosActuales;
    solpe.nuevoComentario = '';
    this.mostrarToast('Comentario agregado', 'success');
  } catch (err) {
    console.error(err);
    this.mostrarToast('Error al guardar el comentario.', 'danger');
  }
}
private async obtenerNombreUsuario(): Promise<string> {
  const afUser = await this.afAuth.currentUser;
  if (afUser?.uid) {
    const userSnap = await this.firestore.collection('Usuarios').doc(afUser.uid).get().toPromise();
    const userData = userSnap?.data() as any;
    return userData?.fullName || 'Anónimo';
  }
  return 'Anónimo';
}
  verPDFComparacion(solpedId: string, pdfId: string) {
    this.firestore.collection('solpes').doc(solpedId).collection('pdfs').doc(pdfId).get().subscribe(doc => {
      if (!doc.exists) {
        this.mostrarToast('El PDF no fue encontrado', 'danger');
        return;
      }

      const data = doc.data() as { base64: string };
      const base64 = data.base64;

      if (!base64) {
        this.mostrarToast('El archivo está vacío', 'danger');
        return;
      }

      const blob = this.base64ToBlob(base64, 'application/pdf');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    });
  }

  descargarPDFComparacion(solpedId: string, pdfId: string) {
    this.firestore.collection('solpes').doc(solpedId).collection('pdfs').doc(pdfId).get().subscribe(doc => {
      if (!doc.exists) {
        this.mostrarToast('El PDF no fue encontrado', 'danger');
        return;
      }

      const data = doc.data() as { base64: string, nombre: string };
      const base64 = data.base64;

      if (!base64) {
        this.mostrarToast('El archivo está vacío', 'danger');
        return;
      }

      const blob = this.base64ToBlob(base64, 'application/pdf');
      const url = URL.createObjectURL(blob);
      const fileName = data.nombre || 'Comparacion.pdf';

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }

  base64ToBlob(base64: string, contentType: string): Blob {
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

    return new Blob(byteArrays, { type: contentType });
  }
  async cambiarEstatus(solpe: any) {
    const alert = await this.alertController.create({
      header: 'Cambiar Estado de la SOLPED',
      inputs: [
        { name: 'estatus', type: 'radio', label: 'OC enviada a proveedor', value: 'OC enviada a proveedor' },
        { name: 'estatus', type: 'radio', label: 'Por importación', value: 'Por importación' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Siguiente',
          handler: async (estatusSeleccionado: string) => {
            if (!estatusSeleccionado) return;
            const solpeRef = this.firestore.collection('solpes').doc(solpe.id);
            try {
              await solpeRef.update({ estatus: estatusSeleccionado });
              let usuarioNombre = 'Desconocido';
              const afUser = await this.afAuth.currentUser;
              if (afUser?.uid) {
                const userSnap = await this.firestore
                  .collection('Usuarios')
                  .doc(afUser.uid)
                  .get()
                  .toPromise();
                if (userSnap?.exists) {
                  const data = userSnap.data() as any;
                  usuarioNombre = data.fullName ?? usuarioNombre;
                }
              }
              await solpeRef.collection('historialEstados').add({
                fecha: new Date(),
                estatus: estatusSeleccionado,
                usuario: usuarioNombre
              });
              solpe.estatus = estatusSeleccionado;
              this.mostrarToast(`SOLPED marcada como "${estatusSeleccionado}"`, 'success');
            } catch (err) {
              console.error(err);
              this.mostrarToast('Error al actualizar estatus', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async mostrarToast(mensaje: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      color: color,
      position: 'top'
    });
    toast.present();
  }
}
