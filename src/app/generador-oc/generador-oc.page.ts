import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ToastController } from '@ionic/angular';
@Component({
  selector: 'app-generador-oc',
  templateUrl: './generador-oc.page.html',
  styleUrls: ['./generador-oc.page.scss'],
})
export class GeneradorOcPage implements OnInit {
  centroCosto: string = '';
  archivoPDF: File | null = null;
  historial: any[] = [];
  pdfUrl: SafeResourceUrl | null = null;
  nombrePDF: string = '';
  tipoArchivo: string = '';
  tipoCompra: string = 'stock';
  destinoCompra: string = '';
  enviando: boolean = false;
  archivo: File | null = null;
  vistaArchivoUrl: SafeResourceUrl | null = null;
  esPDF: boolean = false;
  nuevoIdVisual: number | null = null;
  comentario: string = '';
  solpedDisponibles: any[] = [];
  solpedSeleccionadaId: string = '';
  itemsSolped: any[] = [];
  itemsSeleccionados: Set<string> = new Set();
  usarSolped: boolean = true;
  solpedSeleccionada: any = null;
  precioTotalConIVA: number = 0;
  aprobadorSugerido: string = '';
  archivos: File[] = [];
  vistasArchivos: { url: SafeResourceUrl, esPDF: boolean }[] = [];
  precioFormateado: string = '';
  moneda: string = 'CLP';

  centrosCosto: { [codigo: string]: string } = {
    "10-10-12": "ZEMAQ",
    "20-10-01": "BENÍTEZ",
    "30-10-01": "CASA MATRIZ",
    "30-10-07": "PREDOSIFICADO- SAN BERNARDO",
    "30-10-08": "ÁRIDOS SAN JOAQUÍN",
    "30-10-42": "RAÚL ALFARO",
    "30-10-43": "DET NUEVO",
    "30-10-52": "LUIS CABRERA",
    "30-10-53": "URBANO SAN BERNARDO",
    "30-10-54": "URBANO OLIVAR",
    "30-10-57": "CALAMA",
    "30-10-58": "GASTÓN CASTILLO",
    "30-10-59": "INFRAESTRUCTURA",
    "30-10-60": "PREDOSIFICADO - CALAMA",
    "30-10-61": "ALTO MAIPO"
  };
  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth,
    private sanitizer: DomSanitizer,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.cargarSiguienteNumero();
    this.cargarSolpedSolicitadas();
  }
cargarSolpedSolicitadas() {
  this.firestore.collection('solpes', ref =>
    ref.where('estatus', 'in', ['Solicitado', 'Cotizando'])  // Incluye también "Cotizando"
  ).get().subscribe(snapshot => {
    this.solpedDisponibles = snapshot.docs
      .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
      .sort((a, b) => (a.numero_solpe || 0) - (b.numero_solpe || 0));
  });
}

formatearPrecio(event: any) {
  const rawValue = event.detail.value.replace(/\D/g, '');
  const numero = Number(rawValue);
  this.precioTotalConIVA = numero;

  this.precioFormateado = numero.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  this.calcularAprobador();
}


calcularAprobador() {
  const total = this.precioTotalConIVA;

  if (total <= 250000) {
    this.aprobadorSugerido = 'Guillermo Manzor';
  } else if (total <= 2500000) {
    this.aprobadorSugerido = 'Juan Cubillos';
  } else {
    this.aprobadorSugerido = 'Alejandro Candia';
  }
}
eliminarArchivo(index: number) {
  this.archivos.splice(index, 1);
  this.vistasArchivos.splice(index, 1);
  this.mostrarToast('Archivo eliminado correctamente.', 'success');
}

onChangeSolped() {
  if (!this.solpedSeleccionadaId) return;

  this.firestore.collection('solpes').doc(this.solpedSeleccionadaId).get().subscribe(doc => {
    const data: any = doc.data();
    this.solpedSeleccionada = data;

    this.centroCosto = data.numero_contrato || '';

    const todosItems = data.items || [];

    this.itemsSolped = todosItems
      .filter((item: any) => item.estado !== 'completado') // ✅ FILTRAR ítems completados
      .map((item: any) => ({
        ...item,
        cantidad_cotizada: item.cantidad_cotizada || 0,
        cantidad_para_cotizar: 0,
        __tempId: `${item.item}-${item.descripcion}`
      }));
  });
}

async onMultipleFilesSelected(event: any) {
  const archivosSeleccionados: File[] = Array.from(event.target.files);

  for (const archivo of archivosSeleccionados) {
    const reader = new FileReader();
    const esPDF = archivo.type === 'application/pdf';
    const mimeType = archivo.type;

    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      let finalFile: File = archivo;
      let finalUrl: SafeResourceUrl;

      if (!esPDF) {
        try {
          const pdfBase64 = await this.convertirImagenAPdf(base64, mimeType);
          const nombreFinal = archivo.name.replace(/\.[^/.]+$/, '') + '.pdf';
          finalFile = this.base64ToFile(pdfBase64, nombreFinal, 'application/pdf');
          finalUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            URL.createObjectURL(this.base64ToBlob(pdfBase64, 'application/pdf'))
          );
        } catch (e) {
          this.mostrarToast('Error al convertir imagen a PDF', 'danger');
          return;
        }
      } else {
        finalUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          URL.createObjectURL(this.base64ToBlob(base64, mimeType))
        );
      }

      this.archivos.push(finalFile);
      this.vistasArchivos.push({ url: finalUrl, esPDF });
    };

    reader.readAsDataURL(archivo);
  }
}


async onFileSelected(event: any) {
  const archivoOriginal = event.target.files[0];
  if (!archivoOriginal) return;

  this.nombrePDF = archivoOriginal.name;
  const esPDF = archivoOriginal.type === 'application/pdf';
  const mimeType = archivoOriginal.type;

  const reader = new FileReader();
  reader.onload = async () => {
    const base64 = (reader.result as string).split(',')[1];

    if (!esPDF) {
      try {
        const pdfBase64 = await this.convertirImagenAPdf(base64, mimeType);
        const nombreFinal = this.nombrePDF.replace(/\.[^/.]+$/, "") + ".pdf";
        const pdfFile = this.base64ToFile(pdfBase64, nombreFinal, 'application/pdf');
        this.archivo = pdfFile;
        this.nombrePDF = nombreFinal;
        this.tipoArchivo = 'pdf';
        this.esPDF = true;

        const blob = this.base64ToBlob(pdfBase64, 'application/pdf');
        const url = URL.createObjectURL(blob);
        this.vistaArchivoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      } catch (error) {
        console.error("Error al convertir la imagen a PDF:", error);
        this.mostrarToast("Error al convertir la imagen a PDF", 'danger');
      }
    } else {
      this.archivo = archivoOriginal;
      this.tipoArchivo = 'pdf';
      this.esPDF = true;

      const blob = this.base64ToBlob(base64, mimeType);
      const url = URL.createObjectURL(blob);
      this.vistaArchivoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
  };

  reader.readAsDataURL(archivoOriginal);
}

base64ToFile(base64: string, filename: string, mimeType: string): File {
  const byteString = atob(base64);
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }
  return new File([byteArray], filename, { type: mimeType });
}

async convertirImagenAPdf(base64Imagen: string, mimeType: string): Promise<string> {
  const { PDFDocument } = await import('pdf-lib');

  const base64Clean = base64Imagen.includes(',') ? base64Imagen.split(',')[1] : base64Imagen;

  function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.length;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();

  const imageBytes = base64ToUint8Array(base64Clean);

  let image;
  if (mimeType === 'image/png') {
    image = await pdfDoc.embedPng(imageBytes);
  } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    image = await pdfDoc.embedJpg(imageBytes);
  } else {
    throw new Error(`Formato de imagen no soportado: ${mimeType}`);
  }

  const { width, height } = image.scale(1);
  page.setSize(width, height);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width,
    height,
  });

  const pdfBytes = await pdfDoc.save();
  return uint8ArrayToBase64(pdfBytes);
}


async enviarOC() {
  if (this.enviando) return;

  // ✅ Validaciones obligatorias
  if (!this.centroCosto.trim()) {
    this.mostrarToast('Debes seleccionar un Centro de Costo.', 'warning');
    return;
  }

  if (!this.tipoCompra) {
    this.mostrarToast('Debes seleccionar el tipo de compra.', 'warning');
    return;
  }

  if (this.tipoCompra === 'patente' && !this.destinoCompra.trim()) {
    this.mostrarToast('Debes ingresar la patente para el tipo de compra "Patente".', 'warning');
    return;
  }

  if (!this.precioTotalConIVA || this.precioTotalConIVA <= 0) {
    this.mostrarToast('Debes ingresar un precio total con IVA válido.', 'warning');
    return;
  }

  if (!this.moneda) {
    this.mostrarToast('Debes seleccionar una moneda.', 'warning');
    return;
  }

  if (this.archivos.length === 0) {
    this.mostrarToast('Debes subir al menos un archivo.', 'warning');
    return;
  }

  if (this.usarSolped && !this.solpedSeleccionadaId) {
    this.mostrarToast('Selecciona una SOLPED o desactiva la opción.', 'warning');
    return;
  }

  this.enviando = true;

  const user = await this.auth.currentUser;
  const uid = user?.uid;
  let usuario = 'Desconocido';

  if (uid) {
    const userDoc = await this.firestore.collection('Usuarios').doc(uid).get().toPromise();
    if (userDoc?.exists) {
      const userData = userDoc.data() as any;
      usuario = userData?.fullName || usuario;
    }
  }

  const fecha = new Date().toISOString();
  const id = await this.obtenerNuevoId();
  const centroNombre = this.centrosCosto[this.centroCosto] || 'Desconocido';
  const historialEntry = { usuario, estatus: 'Preaprobado', fecha };

  this.calcularAprobador();

  const dataToSave: any = {
    id,
    centroCosto: this.centroCosto,
    centroCostoNombre: centroNombre,
    tipoCompra: this.tipoCompra,
    destinoCompra: this.tipoCompra === 'patente' ? this.destinoCompra : '',
    estatus: 'Preaprobado',
    fechaSubida: firebase.firestore.Timestamp.fromDate(new Date()),
    historial: [historialEntry],
    responsable: usuario,
    comentario: this.comentario || '',
    numero_contrato: this.centroCosto,
    nombre_centro_costo: centroNombre,
    moneda: this.moneda,
    precioTotalConIVA: this.precioTotalConIVA,
    aprobadorSugerido: this.aprobadorSugerido,
    archivosBase64: []
  };

  for (const archivo of this.archivos) {
    const base64: string = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(archivo);
    });

    dataToSave.archivosBase64.push({
      nombre: archivo.name,
      tipo: archivo.type,
      base64
    });
  }

  if (this.usarSolped && this.solpedSeleccionadaId) {
    dataToSave.solpedId = this.solpedSeleccionadaId;

    const itemsFinal = this.itemsSolped.map((item) => {
      const cantidadTotal = item.cantidad;
      const cantidadAnterior = item.cantidad_cotizada || 0;
      const cantidadNueva = Number(item.cantidad_para_cotizar || 0);
      const cantidadActualizada = cantidadAnterior + cantidadNueva;

      let nuevoEstado = 'pendiente';
      if (cantidadActualizada >= cantidadTotal) {
        nuevoEstado = 'completado';
      } else if (cantidadActualizada > 0) {
        nuevoEstado = 'parcial';
      }

      return {
        ...item,
        cantidad_cotizada: cantidadActualizada,
        cantidad_para_cotizar: cantidadNueva,
        estado: nuevoEstado
      };
    });

    dataToSave.items = itemsFinal;
  }

  try {
    await this.firestore.collection('ordenes_oc').add(dataToSave);

    // 👉 Actualizar SOLPED
    if (this.usarSolped && this.solpedSeleccionadaId) {
      const docSnapshot = await this.firestore.collection('solpes').doc(this.solpedSeleccionadaId).get().toPromise();
      if (docSnapshot?.exists) {
        const data = docSnapshot.data() as { items: any[] };
        const todosItemsOriginales = data.items || [];

        const itemsActualizados = todosItemsOriginales.map((item: any) => {
          const clave = `${item.item}-${item.descripcion}`;
          const actualizado = this.itemsSolped.find(i => i.__tempId === clave);

          if (actualizado) {
            const cantidadAnterior = item.cantidad_cotizada || 0;
            const cantidadNueva = Number(actualizado.cantidad_para_cotizar || 0);
            const cantidadTotal = item.cantidad;
            const cantidadFinal = cantidadAnterior + cantidadNueva;

            let nuevoEstado = 'pendiente';
            if (cantidadFinal >= cantidadTotal) {
              nuevoEstado = 'completado';
            } else if (cantidadFinal > 0) {
              nuevoEstado = 'parcial';
            }

            return {
              ...item,
              cantidad_cotizada: cantidadFinal,
              estado: nuevoEstado
            };
          }

          return item;
        });

        // 👉 Calcular estado general de la SOLPED
        const todosCompletados = itemsActualizados.every(i => i.estado === 'completado');
        const todosPendientes = itemsActualizados.every(i => i.estado === 'pendiente');
        const hayParciales = itemsActualizados.some(i => i.estado === 'parcial');

        let nuevoEstatusSolped = 'Solicitado';
        if (todosCompletados) {
          nuevoEstatusSolped = 'Aprobado';
        } else if (hayParciales || !todosPendientes) {
          nuevoEstatusSolped = 'Cotizando';
        }

        await this.firestore.collection('solpes').doc(this.solpedSeleccionadaId).update({
          items: itemsActualizados,
          estatus: nuevoEstatusSolped
        });
      }
    }

    this.mostrarToast('Cotización enviada exitosamente.', 'success');

    // ✅ Limpiar formulario
    this.centroCosto = '';
    this.tipoCompra = 'stock';
    this.destinoCompra = '';
    this.archivos = [];
    this.vistasArchivos = [];
    this.comentario = '';
    this.itemsSeleccionados.clear();
    this.usarSolped = true;
    this.solpedSeleccionadaId = '';
    this.itemsSolped = [];
    this.precioTotalConIVA = 0;
    this.precioFormateado = '';
    this.aprobadorSugerido = '';
    this.moneda = 'CLP';
    await this.cargarSiguienteNumero();

    const inputElement = document.getElementById('inputArchivo') as HTMLInputElement;
    if (inputElement) inputElement.value = '';

  } catch (error) {
    console.error('Error al enviar la cotización:', error);
    this.mostrarToast('Error al enviar la cotización.', 'danger');
  } finally {
    this.enviando = false;
  }
}




toggleSeleccion(id: string) {
  if (this.itemsSeleccionados.has(id)) {
    this.itemsSeleccionados.delete(id);
  } else {
    this.itemsSeleccionados.add(id);
  }
}

  async obtenerNuevoId(): Promise<number> {
    const snap = await this.firestore.collection('ordenes_oc', ref => ref.orderBy('id', 'desc').limit(1)).get().toPromise();
    const lastDoc = snap?.docs[0];
    const lastId = (lastDoc?.data() as any)?.id || 0;
    return lastId + 1;
  }
async cargarSiguienteNumero() {
  this.nuevoIdVisual = await this.obtenerNuevoId();
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
  async mostrarToast(mensaje: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      color,
      position: 'top'
    });
    toast.present();
  }
}
