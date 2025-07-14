import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute } from '@angular/router';
import { AlertController, MenuController, ToastController } from '@ionic/angular';
import { Comparaciones } from '../Interface/Icompara';
import { Item } from '../Interface/IItem';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import * as XLSX from 'xlsx';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-editar-solped',
  templateUrl: './editar-solped.page.html',
  styleUrls: ['./editar-solped.page.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})

export class EditarSolpedPage implements OnInit {

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
  userUid: string = '';
  filtroEmpresa: string = '';
  agrupadasPorEmpresa: { [empresa: string]: any[] } = {};
  solpesAgrupadas: { [empresa: string]: any[] } = {};
  constructor(
    private firestore: AngularFirestore,
    private menu: MenuController,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private toastController: ToastController,
    private cdRef: ChangeDetectorRef,
    private afAuth: AngularFireAuth
  ) {}

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

  ionViewWillEnter() {
    this.menu.enable(true);
  }
  abrirInputOC(solpeId: string) {
    const input = document.getElementById(`ocInput-${solpeId}`) as HTMLInputElement;
    if (input) {
      input.click();
    }
  }
descargarExcel(solpe: any) {
  const worksheetData: any[][] = [];

  worksheetData.push(['SOLICITUD DE COMPRA']);
  worksheetData.push(['Solicitante:', solpe.usuario]);
  worksheetData.push(['Fecha:', solpe.fecha]);
  worksheetData.push(['N° Contrato:', solpe.numero_contrato]);
  worksheetData.push([]);

  const empresasSet = new Set<string>();
  solpe.items.forEach((item: Item) => {
    item.comparaciones?.forEach((comp: Comparaciones) => {
      if (comp.empresa) {
        empresasSet.add(comp.empresa.toUpperCase());
      }
    });
  });

  const empresas = Array.from(empresasSet);
  worksheetData.push(['ITEM', 'CANTIDAD', 'DESCRIPCIÓN','CODIGO_REFERENCIAL', ...empresas]);

  solpe.items.forEach((item: Item, index: number) => {
    const filaBase = [
      item.item || (index + 1),
      item.cantidad || '',
      item.descripcion || '',
      item.codigo_referencial || '',
    ];

    const preciosPorEmpresa: { [empresa: string]: string | number } = {};
    item.comparaciones?.forEach((comp: Comparaciones) => {
      const empresa = comp.empresa?.toUpperCase();
      if (empresa) {
        const precioDesc = `${comp.precioBase || comp.precio} (desc. ${comp.descuento || 0}%)`;
        preciosPorEmpresa[empresa] = precioDesc;
      }
    });

    const preciosEnOrden = empresas.map(nombre => preciosPorEmpresa[nombre] || '');
    worksheetData.push([...filaBase, ...preciosEnOrden]);
  });

  const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook: XLSX.WorkBook = XLSX.utils.book_new();
  const sheetName = `SOLPED_${solpe.numero_solpe}`;
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const fechaActual = new Date().toISOString().split('T')[0];
  const nombreArchivo = `SOLPED_${solpe.numero_solpe}_${fechaActual}.xlsx`;
  XLSX.writeFile(workbook, nombreArchivo);
}

  subirOC(event: any, solpeId: string) {
    const archivo: File = event.target.files[0];

    if (archivo) {
      const reader = new FileReader();

      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const nombreArchivo = archivo.name;

        const ocRef = this.firestore.collection('solpes').doc(solpeId).collection('ocs');
        const docRef = await ocRef.add({ nombre: nombreArchivo, base64 });

        if (!this.ocsCargadas[solpeId]) {
          this.ocsCargadas[solpeId] = [];
        }

        this.ocsCargadas[solpeId].push({ id: docRef.id, nombre: nombreArchivo });

        this.mostrarToast(`OC "${nombreArchivo}" subida correctamente`, 'success');
      };

      reader.onerror = () => {
        this.mostrarToast(`Error al leer archivo "${archivo.name}"`, 'danger');
      };

      reader.readAsDataURL(archivo);
    }
  }

  async eliminarOC(solpeId: string, ocId: string, nombre: string) {
    try {
      await this.firestore.collection('solpes').doc(solpeId).collection('ocs').doc(ocId).delete();
      this.ocsCargadas[solpeId] = this.ocsCargadas[solpeId].filter(oc => oc.id !== ocId);
      this.mostrarToast(`OC "${nombre}" eliminada correctamente`, 'success');
    } catch (error) {
      console.error('Error al eliminar OC:', error);
      this.mostrarToast('No se pudo eliminar la OC', 'danger');
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

  const solpe = this.solpesFiltradas.find(s => s.id === solpeId);
  if (solpe && solpe.usuario_uid === this.userUid && !solpe.comentariosVistos?.[this.userUid]) {
    const updateData = { [`comentariosVistos.${this.userUid}`]: true };
    this.firestore.collection('solpes').doc(solpeId).update(updateData);
    solpe.comentariosVistos = { ...(solpe.comentariosVistos || {}), [this.userUid]: true };
  }

  // Cargar OCs solo si no están ya cargadas
  if (!this.ocsCargadas[solpeId]) {
    this.firestore.collection('solpes').doc(solpeId).collection('ocs').get().subscribe(snapshot => {
      this.ocsCargadas[solpeId] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    });
  }
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
agruparPorEmpresa(solpes: any[]): { [empresa: string]: any[] } {
  const agrupadas: { [empresa: string]: any[] } = {};
  for (const solpe of solpes) {
    const empresa = solpe.empresa || 'Sin Empresa';
    if (!agrupadas[empresa]) agrupadas[empresa] = [];
    agrupadas[empresa].push(solpe);
  }
  return agrupadas;
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
trackBySolpeId(index: number, solpe: any): string {
  return solpe.id;
}
ordenarEmpresaGrupo = (a: any, b: any): number => {
  return a.key.localeCompare(b.key);
};

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
getSolpesAgrupadasPorEmpresa() {
  if (Object.keys(this.agrupadasPorEmpresa).length === 0) {
    const agrupadas: { [empresa: string]: any[] } = {};
    for (const solpe of this.solpesFiltradas) {
      const empresa = solpe.empresa || 'Sin Empresa';
      if (!agrupadas[empresa]) {
        agrupadas[empresa] = [];
      }
      agrupadas[empresa].push(solpe);
    }
    this.agrupadasPorEmpresa = agrupadas;
  }
  return this.agrupadasPorEmpresa;
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
