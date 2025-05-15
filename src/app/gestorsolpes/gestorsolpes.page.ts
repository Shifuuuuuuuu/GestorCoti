import { ChangeDetectorRef, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { SolpeService } from '../services/solpe.service';
import { AlertController, MenuController, ToastController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ArchivoPDF } from '../Interface/IArchivoPDF';
import * as XLSX from 'xlsx';
import { Item } from '../Interface/IItem';
import { Comparaciones } from '../Interface/Icompara';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import 'firebase/compat/firestore';
@Component({
  selector: 'app-gestorsolpes',
  templateUrl: './gestorsolpes.page.html',
  styleUrls: ['./gestorsolpes.page.scss'],
})
export class GestorsolpesPage implements OnInit {
  solpes: any[] = [];
  loading: boolean = true;
  solpesFiltradas: any[] = [];
  dataFacturaPDF: string = '';
  imagenSeleccionada: string = '';
  imagenAmpliadaVisible: boolean = false;
  archivosPDF: { [solpeId: string]: ArchivoPDF[] } = {};
  pdfsCargados: { [solpeId: string]: { id: string; nombre: string }[] } = {};
  openedAccordions: string[] = [];
  @ViewChildren('fileInputPDF') fileInputsPDF!: QueryList<ElementRef>;
  @ViewChildren('fileInput') fileInputs!: QueryList<ElementRef>;
  @ViewChild('fileInputExcel', { static: false }) fileInputExcel!: ElementRef;
  modalAbierto = false;
  itemSeleccionado: any = null;
  solpeIdSeleccionado: string = '';
  comparacionForm = {
    empresa: '',
    precioBase: 0,
    descuento: 0,
    pdfId: ''
  };
  pdfBase64Seleccionado: string = '';
  nombrePDFSeleccionado: string = '';

  constructor(
    private solpeService: SolpeService,
    private alertController: AlertController,
    private firestore: AngularFirestore,
    private toastController: ToastController,
    private menu: MenuController,
    private afAuth: AngularFireAuth
  ) {}

  ngOnInit() {
    setTimeout(() => {
      this.cargarSolpes();
      this.loading = false;
    }, 2000);
    this.listenSolpes();
  }
  abrirComparacionDesdeFlotante(item: any, solpeId: string) {
  this.itemSeleccionado = item;
  this.solpeIdSeleccionado = solpeId;
  this.comparacionForm = { empresa: '', precioBase: 0, descuento: 0, pdfId: '' };
  this.pdfBase64Seleccionado = '';
  this.nombrePDFSeleccionado = '';
  this.modalAbierto = true;
}
cerrarModalComparacion() {
  this.modalAbierto = false;
}
onPDFSeleccionado(event: any) {
  const archivo = event.target.files[0];
  if (!archivo) return;

  this.nombrePDFSeleccionado = archivo.name;

  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result as string;
    this.pdfBase64Seleccionado = result.split(',')[1];
  };
  reader.readAsDataURL(archivo);
}
async guardarComparacionDesdeModal() {
  const { empresa, precioBase, descuento, pdfId } = this.comparacionForm;

  if (!empresa || !precioBase) {
    this.mostrarToast('Empresa y precio son obligatorios', 'danger');
    return;
  }

  const precioFinal = precioBase * (1 - (descuento || 0) / 100);
  const comparacion = {
    id: Date.now(),
    empresa: empresa.trim(),
    precioBase,
    descuento: descuento || 0,
    precio: precioFinal,
    pdfId: pdfId || '',
    destacado: false
  };

  this.itemSeleccionado.comparaciones = this.itemSeleccionado.comparaciones || [];
  this.itemSeleccionado.comparaciones.push(comparacion);

  await this.actualizarComparacionEnFirestore(this.solpeIdSeleccionado, this.itemSeleccionado);
  this.mostrarToast('Comparación agregada correctamente', 'success');
  this.cerrarModalComparacion();
}



  listenSolpes() {
  this.firestore
    .collection('solpes', ref => ref.where('estatus', '==', 'Solicitado'))
    .snapshotChanges()
    .subscribe(actions => {
      this.solpes = actions.map(a => {
        const data = a.payload.doc.data() as any;
        const id   = a.payload.doc.id;
        let itemsRaw = data.items;
        if (!Array.isArray(itemsRaw) && itemsRaw) {
          itemsRaw = Object.values(itemsRaw);
        }
        const items: Item[] = (itemsRaw as any[]).map(it => ({
          ...it,
          comparaciones: Array.isArray(it.comparaciones) ? it.comparaciones : []
        }));

        return { id, ...data, items };
      });
    });
}
  onAccordionChange(event: any) {
    this.openedAccordions = event.detail.value;
  }
  trackByItemId(index: number, item: Item) {
    return item.id;
  }
  verFactura(base64Data: string) {
    const base64Clean = base64Data.replace(/^data:application\/pdf;base64,/, '');
    const blob = this.base64ToBlob(base64Clean, 'application/pdf');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

    abrirArchivoExcel() {
      const inputFile: HTMLInputElement = document.createElement('input');
      inputFile.type = 'file';
      inputFile.accept = '.xlsx, .xls';
      inputFile.click();
      inputFile.onchange = (e) => this.leerArchivoExcel(e);
    }


leerArchivoExcel(event: any) {
  const archivo = event.target.files[0];
  if (archivo) {
    const reader = new FileReader();
    reader.onload = (e) => this.procesarArchivoExcel(reader.result as string);
    reader.readAsBinaryString(archivo);
  }
}

procesarArchivoExcel(data: string) {
  const wb = XLSX.read(data, { type: 'binary' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const jsonData: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  this.cargarComparacionesDesdeExcel(jsonData);
}


abrirInputExcel() {
  this.fileInputExcel.nativeElement.click();
}
cargarComparacionesDesdeExcel(data: any[][]): void {
  if (!data || data.length === 0) return;

  const headersRowIndex = data.findIndex(row =>
    row.some(cell =>
      typeof cell === 'string' &&
      cell.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().includes('DESCRIPCION')
    )
  );

  if (headersRowIndex === -1) {
    console.warn('❌ No se encontró la fila de encabezado con "DESCRIPCION"');
    return;
  }

  const headersRow = data[headersRowIndex];

  const descripcionIndex = headersRow.findIndex(cell =>
    typeof cell === 'string' &&
    cell.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().includes('DESCRIPCION')
  );
  const cantidadIndex = headersRow.findIndex(cell =>
    typeof cell === 'string' &&
    cell.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().includes('CANTIDAD')
  );
  const stockIndex = headersRow.findIndex(cell =>
    typeof cell === 'string' &&
    cell.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().includes('STOCK')
  );

  const empresaIndices = headersRow
    .map((col, i) => ({
      nombre: col?.toString().trim(),
      index: i
    }))
    .filter(e =>
      e.index > descripcionIndex &&
      e.nombre &&
      typeof e.nombre === 'string' &&
      e.nombre.length > 0
    );

  const startIndex = headersRowIndex + 1;

  for (let r = startIndex; r < data.length; r++) {
    const row = data[r];
    const descripcion = row[descripcionIndex]?.toString().trim();

    if (!descripcion) continue;

    this.solpes.forEach(sol => {
      sol.items
        .filter((it: Item) =>
          it.descripcion?.toString().trim().toLowerCase() === descripcion.toLowerCase()
        )
        .forEach((it: Item) => {
          empresaIndices.forEach(({ nombre, index }) => {
            const precioBase = Number(row[index]);
            if (!isNaN(precioBase)) {
              const comparacion = {
                id: Date.now() + Math.random(),
                empresa: nombre,
                precioBase,
                descuento: 0,
                precio: precioBase,
                pdfId: '',
                destacado: false
              };
              it.comparaciones = it.comparaciones || [];
              it.comparaciones.push(comparacion);
            }
          });
        });

      this.firestore
        .collection('solpes')
        .doc(sol.id)
        .update({ items: sol.items })
        .catch(err => {
          console.error(err);
          this.mostrarToast(`❌ Error guardando comparaciones en SOLPE ${sol.id}`, 'danger');
        });
    });
  }
}




generarId(): string {
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

agregarComparacion(item: Item) {
  const solpeId = 'id_del_solpe';
  const solpe = this.solpes.find(s => s.id === solpeId);

  if (solpe) {
    const itemIndex = solpe.items.findIndex((i: Item) => i.id === item.id);

    if (itemIndex !== -1) {
      solpe.items[itemIndex].comparaciones.push(...item.comparaciones);
      this.firestore.collection('solpes').doc(solpeId).update({
        items: solpe.items,
      }).then(() => {
        this.mostrarToast('Comparación agregada desde Excel', 'success');
      }).catch(err => {
        console.error(err);
        this.mostrarToast('Error al agregar comparación', 'danger');
      });
    }
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
  worksheetData.push([
    'ITEM','CANTIDAD', 'DESCRIPCION',
    ...empresas
  ]);
  solpe.items.forEach((item: Item, index: number) => {
    const filaBase = [
      item.item || (index + 1),

      item.cantidad || '',
      item.descripcion || '',
    ];

    const preciosPorEmpresa: { [empresa: string]: string | number } = {};
    item.comparaciones?.forEach((comp: Comparaciones) => {
      const empresa = comp.empresa?.toUpperCase();
      if (empresa) {
        const pdfNombre = this.obtenerNombrePDF(solpe.id, comp.pdfId);
        preciosPorEmpresa[empresa] = `${comp.precio} ${pdfNombre ? `(${pdfNombre})` : ''}`;
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

obtenerNombrePDF(solpeId: string, pdfId?: string): string {
  if (!pdfId) return '';

  const pdfList = this.pdfsCargados[solpeId];
  if (!pdfList) return '';

  const encontrado = pdfList.find(p => p.id === pdfId);
  return encontrado ? encontrado.nombre : '';
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

cargarSolpes() {
  this.solpeService.obtenerTodasLasSolpes().subscribe((data: any[]) => {
    const filtradas = data.filter(solpe => solpe.estatus === 'Solicitado');
    this.solpes = filtradas.map((solpe: any) => {
      let itemsRaw = solpe.items;
      if (!Array.isArray(itemsRaw) && itemsRaw && typeof itemsRaw === 'object') {
        itemsRaw = Object.values(itemsRaw);
      }
      const items: Item[] = (itemsRaw as any[]).map((it: any) => ({
        ...it,
        comparaciones: Array.isArray(it.comparaciones) ? it.comparaciones : []
      }));

      return { ...solpe, items };
    });
  });
}


  ionViewWillEnter() {
    this.menu.enable(false);
  }

  async cambiarEstatus(solpe: any) {
    const alert = await this.alertController.create({
      header: 'Cambiar Estado de la SOLPE',
      inputs: [
        { name: 'estatus', type: 'radio', label: 'Preaprobado', value: 'Preaprobado' },
        { name: 'estatus', type: 'radio', label: 'Tránsito a Faena', value: 'Tránsito a Faena' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Siguiente',
          handler: async (estatusSeleccionado: string) => {
            if (!estatusSeleccionado) return;
            const solpeRef = this.firestore.collection('solpes').doc(solpe.id);

            solpeRef
              .update({ estatus: estatusSeleccionado })
              .then(async () => {
                solpe.estatus = estatusSeleccionado;
                this.mostrarToast(`SOLPE marcada como "${estatusSeleccionado}"`, 'success');
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
                await solpeRef
                  .collection('historialEstados')
                  .add({
                    fecha: new Date(),
                    estatus: estatusSeleccionado,
                    usuario: usuarioNombre
                  });
                if (
                  this.archivosPDF[solpe.id]?.length > 0 &&
                  (estatusSeleccionado === 'Preaprobado' || estatusSeleccionado === 'Tránsito a Faena')
                ) {
                  try {
                    const pdfsParaSubir = this.archivosPDF[solpe.id].map(pdf => ({
                      nombre: pdf.nombre,
                      base64: pdf.base64
                    }));
                    await solpeRef.update({ pdfs: pdfsParaSubir });
                    this.archivosPDF[solpe.id] = [];
                    this.mostrarToast('PDFs cargados en la SOLPE', 'success');
                  } catch (error) {
                    console.error('Error al subir PDFs:', error);
                    this.mostrarToast('Error al subir PDFs', 'danger');
                  }
                }
              })
              .catch(err => {
                console.error(err);
                this.mostrarToast('Error al actualizar estatus', 'danger');
              });
          }
        }
      ]
    });

    await alert.present();
  }
  abrirInputArchivos(solpeId: string) {
    const index = this.solpes.findIndex(s => s.id === solpeId);
    if (index !== -1 && this.fileInputsPDF && this.fileInputsPDF.toArray()[index]) {
      this.fileInputsPDF.toArray()[index].nativeElement.click();
    }
  }
  groupComparacionesPorEmpresa(item: any): { [empresa: string]: any[] } {
    const agrupadas: { [empresa: string]: any[] } = {};
    for (const comp of item.comparaciones) {
      const empresa = comp.empresa?.toUpperCase() || 'SIN NOMBRE';
      if (!agrupadas[empresa]) agrupadas[empresa] = [];
      agrupadas[empresa].push(comp);
    }
    return agrupadas;
  }

  getEmpresas(item: any): string[] {
    return Object.keys(this.groupComparacionesPorEmpresa(item));
  }

  getEmpresasSugeridas(): string[] {
    const empresas = new Set<string>();

    this.solpes.forEach((solpe: { items: Item[] }) =>
      solpe.items.forEach((item: Item) =>
        item.comparaciones?.forEach((comp: Comparaciones) => {
          if (comp.empresa) empresas.add(comp.empresa.toUpperCase());
        })
      )
    );

    return Array.from(empresas);
  }

  verImagenAmpliada(base64: string) {
    this.imagenSeleccionada = base64;
    this.imagenAmpliadaVisible = true;
  }

  cerrarImagenAmpliada() {
    this.imagenAmpliadaVisible = false;
  }
  verPDFComparacion(solpeId: string, pdfId: string) {
    this.firestore.collection('solpes').doc(solpeId).collection('pdfs').doc(pdfId).get().subscribe(doc => {
      if (!doc.exists) {
        this.mostrarToast('El PDF no fue encontrado', 'danger');
        return;
      }

      const data = doc.data() as ArchivoPDF;
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


  async subirPDFs(event: any, solpeId: string, item: any) {
    const archivos: FileList = event.target.files;

    if (archivos.length > 0) {
      for (let i = 0; i < archivos.length; i++) {
        const archivo = archivos[i];
        const reader = new FileReader();

        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const nombreArchivo = archivo.name;
          const inputOptions = item.comparaciones.map((comp: any, index: number) => ({
            name: 'comparacion',
            type: 'radio',
            label: `Empresa: ${comp.empresa} | N° Cot: ${comp.numeroCotizacion}`,
            value: index.toString()
          }));

          const alert = await this.alertController.create({
            header: 'Selecciona la comparación',
            inputs: inputOptions,
            buttons: [
              {
                text: 'Cancelar',
                role: 'cancel'
              },
              {
                text: 'Asignar',
                handler: async (selectedIndex: string) => {
                  const index = parseInt(selectedIndex, 10);
                  const pdfRef = this.firestore.collection('solpes').doc(solpeId).collection('pdfs');
                  const docRef = await pdfRef.add({
                    nombre: nombreArchivo,
                    base64: base64
                  });

                  item.comparaciones[index].pdfId = docRef.id;
                  await this.firestore.collection('solpes').doc(solpeId).update({
                    items: [...item.solpe.items]
                  });
                  if (!this.pdfsCargados[solpeId]) {
                    this.pdfsCargados[solpeId] = [];
                  }
                  this.pdfsCargados[solpeId].push({ id: docRef.id, nombre: nombreArchivo });


                  this.mostrarToast(`PDF "${nombreArchivo}" asignado correctamente`, 'success');
                }
              }
            ]
          });

          await alert.present();
        };

        reader.onerror = () => {
          this.mostrarToast(`Error al leer archivo "${archivo.name}"`, 'danger');
        };

        reader.readAsDataURL(archivo);
      }
    }
  }

  subirPDFsGlobal(event: any, solpeId: string) {
    const archivos: FileList = event.target.files;

    if (archivos.length > 0) {
      for (let i = 0; i < archivos.length; i++) {
        const archivo = archivos[i];
        const reader = new FileReader();

        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const nombreArchivo = archivo.name;

          const pdfRef = this.firestore.collection('solpes').doc(solpeId).collection('pdfs');
          const docRef = await pdfRef.add({ nombre: nombreArchivo, base64 });
          if (!this.pdfsCargados[solpeId]) {
            this.pdfsCargados[solpeId] = [];
          }

          this.pdfsCargados[solpeId].push({ id: docRef.id, nombre: nombreArchivo });

          this.mostrarToast(`PDF "${nombreArchivo}" subido correctamente`, 'success');
        };

        reader.onerror = () => {
          this.mostrarToast(`Error al leer archivo "${archivo.name}"`, 'danger');
        };

        reader.readAsDataURL(archivo);
      }
    }
  }
async abrirComparacion(item: any, solpeId: string) {
  const alert = await this.alertController.create({
        header: 'Agregar Comparación de Precios',
    inputs: [
      { name: 'empresa',   type: 'text',   placeholder: 'Nombre de la Empresa' },
      { name: 'precio',    type: 'number', placeholder: 'Precio base' },
      { name: 'descuento', type: 'number', placeholder: 'Descuento (%) — opcional' },
    ],
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Agregar',
        handler: (data): boolean => {
          if (!data.empresa || !data.precio) {
            this.mostrarToast('Debes ingresar empresa y precio', 'danger');
            return false;
          }
          const precioBase  = Number(data.precio);
          const descuento   = Number(data.descuento) || 0;
          const precioFinal = precioBase * (1 - descuento / 100);
          const nuevoId     = Date.now();
          item.comparaciones = item.comparaciones || [];
          item.comparaciones.push({
            id:         nuevoId,
            empresa:    data.empresa,
            precioBase,
            descuento,
            precio:     precioFinal
          });
          this.firestore
            .collection('solpes')
            .doc(solpeId)
            .update({ items: this.solpes.find(s => s.id === solpeId)!.items });

          return true;
        }
      }
    ]
  });
  await alert.present();
}



eliminarComparacion(item: any, index: number) {
  item.comparaciones.splice(index, 1);
}

  async eliminarPDF(solpeId: string, pdfId: string, nombre: string) {
    try {
      await this.firestore.collection('solpes').doc(solpeId).collection('pdfs').doc(pdfId).delete();
      this.pdfsCargados[solpeId] = this.pdfsCargados[solpeId].filter(pdf => pdf.id !== pdfId);

      this.mostrarToast(`PDF "${nombre}" eliminado correctamente`, 'success');
    } catch (error) {
      console.error('Error al eliminar PDF:', error);
      this.mostrarToast('No se pudo eliminar el PDF', 'danger');
    }
  }

  guardarComparacion(item: any, solpeId: string) {
    const solpeRef = this.firestore.collection('solpes').doc(solpeId);
    const itemRef = solpeRef.collection('items').doc(item.id);

    itemRef.update({ comparaciones: item.comparaciones });
  }

async eliminarComparacionCompleta(solpeId: string, itemId: string, comparacionId: number) {
  const solpe = this.solpes.find((s: any) => s.id === solpeId);
  if (!solpe) return this.mostrarToast('SOLPE no encontrada', 'danger');

  const item = solpe.items.find((it: Item) => it.id === itemId);
  if (!item) return this.mostrarToast('Ítem no encontrado', 'danger');

  if (!Array.isArray(item.comparaciones)) {
    return this.mostrarToast('No hay comparaciones', 'danger');
  }
  item.comparaciones = item.comparaciones.filter((c: Comparaciones) => c.id !== comparacionId);

  try {
    await this.firestore
      .collection('solpes')
      .doc(solpeId)
      .update({ items: solpe.items });

    this.mostrarToast('Comparación eliminada', 'success');
  } catch {
    this.mostrarToast('Error al eliminar comparación', 'danger');
  }
}

  destacarComparacion(item: any, index: number) {
    item.comparaciones[index].destacado = !item.comparaciones[index].destacado;
    const solpeRef = this.firestore.collection('solpes').doc(item.solpeId);
    solpeRef.update({
      items: item.comparaciones
    }).then(() => {
      console.log('Comparación actualizada en Firestore');
    }).catch(err => {
      console.error('Error al actualizar comparación:', err);
    });
  }

async subirComparaciones(solpe: any) {
  const confirm = await this.alertController.create({
    header: 'Confirmar',
    message: '¿Estás seguro de subir las comparaciones a Firestore?',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Sí, subir',
        handler: () => {
          this.firestore.collection('solpes').doc(solpe.id).update({
            items: solpe.items
          }).then(() => {
            console.log('Comparaciones subidas a Firestore');
          }).catch(err => {
            console.error('Error al subir comparaciones:', err);
          });
        }
      }
    ]
  });
  await confirm.present();
}
  async actualizarComparacionEnFirestore(solpeId: string, item: Item): Promise<void> {
    const solpe = this.solpes.find(s => s.id === solpeId);
    if (!solpe) return;
    const nuevosItems: Item[] = (solpe.items as Item[]).map((it: Item) =>
      it.id === item.id ? item : it
    );

    try {
      await this.firestore
        .collection('solpes')
        .doc(solpeId)
        .update({ items: nuevosItems });

      this.mostrarToast('Comparación guardada correctamente', 'success');
      solpe.items = nuevosItems;
    } catch (err) {
      console.error(err);
      this.mostrarToast('Error al guardar comparación', 'danger');
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
