import { Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { SolpeService } from '../services/solpe.service';
import { AlertController, MenuController, ToastController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ArchivoPDF } from '../Interface/IArchivoPDF';
import * as XLSX from 'xlsx';
import { Item } from '../Interface/IItem';
import { Comparaciones } from '../Interface/Icompara';
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
  @ViewChildren('fileInputPDF') fileInputsPDF!: QueryList<ElementRef>;

  @ViewChildren('fileInput') fileInputs!: QueryList<ElementRef>;

  constructor(
    private solpeService: SolpeService,
    private alertController: AlertController,
    private firestore: AngularFirestore,
    private toastController: ToastController,
    private menu: MenuController,
  ) {}

  ngOnInit() {
    setTimeout(() => {
      this.cargarSolpes();
      this.loading = false;
    }, 2000);
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

    const jsonData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    this.cargarComparacionesDesdeExcel(jsonData);
  }


  cargarComparacionesDesdeExcel(data: any[][]): void {
    let currentCompany = '';

    // Iterar todas las filas
    for (let r = 0; r < data.length; r++) {
      const row = data[r];
      if (!row || row.length === 0) continue;

      const key = row[0]?.toString().trim().toLowerCase();

      if (key === 'empresa') {
        // Nueva sección: guardamos la empresa
        currentCompany = row[1]?.toString().trim() ?? '';
      }
      else if (key === 'descripción') {
        // Fila de detalle: descripción, cantidad y precio base
        const descripcion = row[1]?.toString().trim() ?? '';
        const cantidad    = Number(row[2]) || 0;
        const precioBase  = Number(row[3]) || 0;
        const precioFinal = precioBase;      // como pides, mismo valor
        const descuento   = 0;               // siempre 0

        if (!currentCompany || !descripcion) continue;

        // Para cada SOLPE que tenga un ítem con esa descripción…
        this.solpes
          .filter(sol => sol.items.some((it: Item) =>
            it.descripcion.trim().toLowerCase() === descripcion.toLowerCase()
          ))
          .forEach(sol => {
            // Añadimos la comparativa a cada ítem coincidente
            sol.items
              .filter((it: Item) =>
                it.descripcion.trim().toLowerCase() === descripcion.toLowerCase()
              )
              .forEach((it: Item) => {
                it.comparaciones = it.comparaciones || [];
                it.comparaciones.push({
                  id:      Date.now(),
                  empresa: currentCompany,
                  precioBase,
                  descuento,
                  precio: precioFinal,
                  pdfId:   '',
                  destacado: false
                });
              });

            // Y actualizamos Firestore para esta SOLPE
            this.firestore
              .collection('solpes')
              .doc(sol.id)
              .update({ items: sol.items })
              .then(() => this.mostrarToast(`Comparaciones guardadas en SOLPE ${sol.id}`, 'success'))
              .catch(err => {
                console.error(err);
                this.mostrarToast(`Error guardando comparaciones en SOLPE ${sol.id}`, 'danger');
              });
          });
      }
    }
  }


generarId(): string {
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

agregarComparacion(item: Item) {
  const solpeId = 'id_del_solpe';  // Debes asegurarte de tener el solpeId correcto
  const solpe = this.solpes.find(s => s.id === solpeId);

  if (solpe) {
    const itemIndex = solpe.items.findIndex((i: Item) => i.id === item.id);

    if (itemIndex !== -1) {
      solpe.items[itemIndex].comparaciones.push(...item.comparaciones);  // Agrega las comparaciones al item
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

  // Encabezado
  worksheetData.push([
    'Empresa',
    '',
    'Cantidad',
    'Precio',
  ]);

  // Datos por ítem y comparaciones
  solpe.items.forEach((item: Item) => {
    if (item.comparaciones && item.comparaciones.length > 0) {
      item.comparaciones.forEach((comp: Comparaciones) => {
        const precioBase = comp.precioBase || 0;
        const descuento = comp.descuento || 0;
        const precioFinal = comp.precio || 0;

        worksheetData.push([
          item.descripcion || '',
          item.cantidad || '',
          comp.empresa || '',
          precioBase,
          descuento,
          precioFinal
        ]);
      });
    } else {
      worksheetData.push([
        'Descripción',
        item.descripcion || '',
        item.cantidad || '',
        0,
      ]);
    }
  });

  const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook: XLSX.WorkBook = XLSX.utils.book_new();
  const sheetName = `SOLPED_${solpe.numero_solpe}`;

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const fechaActual = new Date().toISOString().split('T')[0];
  const nombreArchivo = `SOLPED_${solpe.numero_solpe}_${fechaActual}.xlsx`;

  XLSX.writeFile(workbook, nombreArchivo);
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
        solpe.items = solpe.items.map((item: any) => {
          return {
            ...item,
            comparaciones: item.comparaciones || [],
          };
        });
        return solpe;
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
          handler: async (estatusSeleccionado) => {
            if (estatusSeleccionado) {
              this.firestore.collection('solpes').doc(solpe.id).update({
                estatus: estatusSeleccionado,
              }).then(async () => {
                solpe.estatus = estatusSeleccionado;
                this.mostrarToast(`SOLPE marcada como "${estatusSeleccionado}"`, 'success');
                if (
                  this.archivosPDF[solpe.id]?.length > 0 &&
                  (estatusSeleccionado === 'Pre Aprobado' || estatusSeleccionado === 'Tránsito a Faena')
                ) {
                  try {
                    const pdfsParaSubir = this.archivosPDF[solpe.id].map(pdf => ({
                      nombre: pdf.nombre,
                      base64: pdf.base64,
                    }));

                    await this.firestore.collection('solpes').doc(solpe.id).update({
                      pdfs: pdfsParaSubir
                    });

                    this.archivosPDF[solpe.id] = [];
                    this.mostrarToast('PDFs cargados en la SOLPE', 'success');
                  } catch (error) {
                    console.error('Error al subir PDFs:', error);
                    this.mostrarToast('Error al subir PDFs', 'danger');
                  }
                }
              }).catch(err => {
                this.mostrarToast('Error al actualizar estatus', 'danger');
                console.error(err);
              });
            }
          },
        },
      ],
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
  async abrirComparacion(item: Item, solpe: any) {
    const alert = await this.alertController.create({
      header: 'Agregar Comparación de Precios',
      inputs: [
        { name: 'empresa', type: 'text', placeholder: 'Nombre de la empresa' },
        { name: 'precio', type: 'number', placeholder: 'Precio base' },
        { name: 'descuento', type: 'number', placeholder: 'Descuento (%) - opcional' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar',
          handler: (data) => {
            // Validación básica
            if (!data.empresa || !data.precio) {
              this.mostrarToast('Debes ingresar empresa y precio', 'danger');
              return false;
            }

            // Cálculo de precios
            const precioBase  = Number(data.precio);
            const descuento   = Number(data.descuento) || 0;
            const precioFinal = precioBase * (1 - descuento / 100);

            // Agregar la nueva comparativa al ítem
            item.comparaciones = item.comparaciones || [];
            item.comparaciones.push({
              id:         Date.now(),
              empresa:    data.empresa,
              precioBase,
              descuento,
              precio:     precioFinal,
              pdfId:      '',
              destacado:  false
            });

            // Guardar TODO el array de items de la SOLPE
            this.guardarComparacionesEnFirestore(solpe);
            return true;
          }
        }
      ]
    });

    await alert.present();
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

  eliminarComparacion(solpe: any, item: Item, comp: Comparaciones) {
    const idx = item.comparaciones.findIndex(c => c.id === comp.id);
    if (idx < 0) return;
    item.comparaciones.splice(idx, 1);
    this.saveSolpeItems(solpe.id, solpe.items);
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
  private async saveSolpeItems(solpeId: string, items: Item[]) {
    try {
      await this.firestore.collection('solpes').doc(solpeId).update({ items });
      this.mostrarToast('Datos guardados', 'success');
    } catch (err) {
      console.error(err);
      this.mostrarToast('Error al guardar', 'danger');
    }
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
