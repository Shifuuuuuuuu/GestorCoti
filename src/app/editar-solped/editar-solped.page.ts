import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute } from '@angular/router';
import { AlertController, MenuController, ToastController } from '@ionic/angular';
import { Comparaciones } from '../Interface/Icompara';
import { Solpes } from '../Interface/ISolpes';
import { Item } from '../Interface/IItem';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-editar-solped',
  templateUrl: './editar-solped.page.html',
  styleUrls: ['./editar-solped.page.scss'],
})

export class EditarSolpedPage implements OnInit {
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
  listaEstatus: string[] = ['Aprobado', 'Rechazado', 'Solicitado', 'Tránsito a Faena', 'Pre Aprobado'];
  solpesFiltradas: any[] = [];
  solpesOriginal: any[] = [];
  ordenAscendente: boolean = true;
  loading: boolean = true;
  ocsCargadas: { [solpeId: string]: { id: string, nombre: string }[] } = {};

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
    this.menu.enable(false);
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
  worksheetData.push(['ITEM', 'CANTIDAD', 'DESCRIPCIÓN', ...empresas]);

  solpe.items.forEach((item: Item, index: number) => {
    const filaBase = [
      item.item || (index + 1),
      item.cantidad || '',
      item.descripcion || ''
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
  verOC(solpedId: string, ocId: string) {
    this.firestore.collection('solpes').doc(solpedId).collection('ocs').doc(ocId).get().subscribe(doc => {
      if (!doc.exists) {
        this.mostrarToast('La OC no fue encontrada', 'danger');
        return;
      }

      const data = doc.data() as { base64: string, nombre?: string };
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


toggleDetalle(solpeId: string) {
  this.solpeExpandidaId = this.solpeExpandidaId === solpeId ? null : solpeId;

  if (this.solpeExpandidaId) {
    if (!this.ocsCargadas[solpeId]) {
      this.firestore
        .collection('solpes')
        .doc(solpeId)
        .collection('ocs')
        .get()
        .subscribe(snapshot => {
          this.ocsCargadas[solpeId] = snapshot.docs.map(doc => ({
            id: doc.id,
            nombre: doc.data()['nombre']
          }));
          this.cdRef.detectChanges();
        });
    }
  }
}

  async eliminarComparacionFirestore(solpedId: string, itemId: string, comparacionId: number) {
    const solpedRef = this.firestore.collection('solpes').doc(solpedId);

    try {
      const solpedDoc = await solpedRef.get().toPromise();

      if (solpedDoc && solpedDoc.exists) {
        const solpedData = solpedDoc.data() as Solpes;
        const items: Item[] = solpedData?.items || [];

        const item = items.find((i: Item) => i.id === itemId);
        if (item) {
          const comparacionIndex = item.comparaciones.findIndex(
            (comp: Comparaciones) => comp.id === comparacionId
          );

          if (comparacionIndex !== -1) {
            item.comparaciones = item.comparaciones.filter(
              (comp: Comparaciones) => comp.id !== comparacionId
            );
            await solpedRef.update({ items });
            this.mostrarToast('Comparación eliminada de Firestore', 'success');
          } else {
            console.log('❌ Comparación no encontrada');
            this.mostrarToast('Comparación no encontrada', 'danger');
          }
        } else {
          console.log('❌ Ítem no encontrado');
          this.mostrarToast('Ítem no encontrado', 'danger');
        }
      } else {
        console.log('❌ Documento no encontrado o vacío');
        this.mostrarToast('Documento no encontrado o vacío', 'danger');
      }
    } catch (error) {
      console.error('Error eliminando la comparación:', error);
      this.mostrarToast('Error al eliminar la comparación en Firestore', 'danger');
    }
  }
  eliminarComparacionLocal(item: any, index: number) {
    item.comparaciones.splice(index, 1);
    this.mostrarToast('Comparación eliminada de la UI', 'success');
  }

  async eliminarComparacionCompleta(solpedId: string, itemId: string, comparacionId: number, item: any, index: number) {
    await this.eliminarComparacionFirestore(solpedId, itemId, comparacionId);
    item.comparaciones.splice(index, 1);
    this.cdRef.detectChanges();
  }


  async destacarComparacion(solpeId: string, item: any, compIdx: number) {
    if (item.comparaciones && item.comparaciones[compIdx]) {
      item.comparaciones[compIdx].destacado =
        !item.comparaciones[compIdx].destacado;
    }

    try {
      const solpeRef = this.firestore.collection('solpes').doc(solpeId);
      const solpeSnap = await solpeRef.get().toPromise();
      if (!solpeSnap || !solpeSnap.exists) {
        throw new Error('SOLPE no encontrado');
      }

      const solpeData = solpeSnap.data() as any;
      const items = solpeData.items || [];
      const idx = items.findIndex((i: any) => i.id === item.id);
      if (idx === -1) {
        throw new Error('Item no encontrado en SOLPE');
      }

      items[idx].comparaciones = item.comparaciones;

      await solpeRef.update({ items });
    } catch (err) {
      console.error(err);
      this.mostrarToast('Error al actualizar comparación', 'danger');
    }
  }
  async abrirComparacion(item: any, solpeId: string) {
    const alert = await this.alertController.create({
      header: 'Agregar Comparación de Precios',
      inputs: [
        { name: 'empresa', type: 'text', placeholder: 'Nombre de la Empresa' },
        { name: 'precio',  type: 'number', placeholder: 'Precio base' },
        { name: 'descuento', type: 'number', placeholder: 'Descuento (%) - opcional' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar',
          handler: async (data) => {
            if (!data.empresa || data.precio == null) {
              this.mostrarToast('Debes ingresar empresa y precio', 'danger');
              return false;
            }

            const precioBase = Number(data.precio);
            const descuentoPct = Number(data.descuento) || 0;
            const precioConDescuento = precioBase * (1 - descuentoPct / 100);
            item.comparaciones = item.comparaciones || [];

            const nuevaComparacion = {
              id: Date.now(),
              empresa: data.empresa,
              precio: precioBase,
              descuento: descuentoPct,
              precioConDescuento
            };
            item.comparaciones.push(nuevaComparacion);

            try {
              const solpeRef = this.firestore.collection('solpes').doc(solpeId);
              const solpeSnap = await solpeRef.get().toPromise();
              if (!solpeSnap || !solpeSnap.exists) {
                throw new Error('SOLPE no encontrado');
              }

              const solpeData = solpeSnap.data() as any;
              const items = solpeData.items || [];
              const idx = items.findIndex((i: any) => i.id === item.id);
              if (idx === -1) {
                throw new Error('Item no encontrado en SOLPE');
              }

              items[idx].comparaciones = item.comparaciones;
              await solpeRef.update({ items });
              this.mostrarToast('Comparación agregada', 'success');
            } catch (err) {
              console.error(err);
              this.mostrarToast('Error al agregar la comparación', 'danger');
            }

            return true;
          }
        }
      ]
    });

    await alert.present();
  }



  async subirComparaciones(solpe: any, auto: boolean = false) {
    if (!auto) {
      const confirm = await this.alertController.create({
        header: 'Confirmar',
        message: '¿Estás seguro de subir las comparaciones a Firestore?',
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          {
            text: 'Sí, subir',
            handler: () => this.guardarComparacionesEnFirestore(solpe)
          }
        ]
      });
      await confirm.present();
    } else {
      this.guardarComparacionesEnFirestore(solpe);
    }
  }
  guardarComparacionesEnFirestore(solpe: any) {
    solpe.items.forEach((item: any) => {
      if (!item.comparaciones || item.comparaciones.length === 0) {
        item.comparaciones = [{
          empresa: 'Sin proveedor válido',
          precio: 0,
          observacion: 'Este proveedor no tenía lo que se buscaba'
        }];
      }
    });

    this.firestore.collection('solpes').doc(solpe.id).update({
      items: solpe.items
    }).then(() => {
      console.log('Comparaciones subidas a Firestore automáticamente');
    }).catch(err => {
      console.error('Error al subir comparaciones:', err);
    });
  }
  validarComparaciones(solpe: any): boolean {
    return solpe.items.every((item: any) => item.comparaciones && item.comparaciones.length > 0);
  }
  guardarComparacion(item: any, solpeId: string) {
    const solpeRef = this.firestore.collection('solpes').doc(solpeId);
    const itemRef = solpeRef.collection('items').doc(item.id);

    itemRef.update({ comparaciones: item.comparaciones });
  }
  cargarSolpes() {
    this.firestore
      .collection('solpes', ref =>
        ref.orderBy('numero_solpe', 'desc')
      )
      .get()
      .subscribe(snapshot => {
        const solpesTemp: any[] = [];
        snapshot.docs.forEach((doc: any) => {
          const solpe = doc.data();
          solpe.id = doc.id;
          solpesTemp.push(solpe);
        });
        this.solpesOriginal = solpesTemp;
        this.solpesFiltradas = [...this.solpesOriginal];
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
          }
        } catch (error) {
          console.error('Error procesando la fecha:', error);
          fechaSolpe = '';
        }
      }

      const coincideFecha = this.filtroFecha ? fechaSolpe === this.filtroFecha : true;
      const coincideEstatus = this.filtroEstatus ? normalize(solpe.estatus) === normalize(this.filtroEstatus) : true;
      const coincideResponsable = this.filtroResponsable ? solpe.numero_contrato?.toLowerCase().includes(this.filtroResponsable) : true;
      const pasaFiltro = coincideFecha && coincideEstatus && coincideResponsable;
      console.log(pasaFiltro, solpe);
      return pasaFiltro;
    });

    console.log(this.solpesFiltradas);
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
      case 'Aprobado':
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
