import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ToastController } from '@ionic/angular';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ArchivoConVista extends File {
  previewUrl?: SafeResourceUrl;
  tipo?: string;
}

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
  tipoArchivo: string = '';
  tipoCompra: string = 'stock';
  destinoCompra: string = '';
  enviando: boolean = false;
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
  archivos: ArchivoConVista[] = [];
  precioFormateado: string = '';
  moneda: string = 'CLP';
  usuarioActual: string = '';
  monedaSeleccionada: string = 'CLP';
  tipoCambioUSD: number = 950;
  tipoCambioEUR: number = 1050;
  centrosCosto: { [key: string]: string } = {
  '22368': 'CONTRATO SUMINISTRO DE HORMIGONES DET',
  '20915': 'CONTRATO SUMINISTRO DE HORMIGONES DAND',
  '23302': 'CONTRATO MANTENCIÓN Y REPARACIÓN DE INFRAESTRUCTURA DAND',
  '28662': 'CONTRATO REPARACIÓN DE CARPETAS DE RODADO DET',
  'SANJOAQUIN': 'SERVICIO PLANTA DE ÁRIDOS SAN JOAQUÍN',
  'URBANOS': 'SUMINISTRO DE HORMIGONES URBANOS SAN BERNARDO Y OLIVAR',
  'CS': 'CONTRATO DE SUMINISTRO DE HORMIGONES CS',
  'BENITEZ': 'CONTRATO PREDOSIFICADO BENÍTEZ',
  'CANECHE': 'CONTRATO TALLER CANECHE',
  'CASAMATRIZ': 'CONTRATO CASA MATRIZ',
  'ALTOMAIPO': 'CONTRATO ALTO MAIPO',
  'INFRAESTRUCTURA': 'CONTRATO INFRAESTRUCTURA DET',
  'CHUQUICAMATA': 'CONTRATO CHUQUICAMATA',
  '10-10-12': 'ZEMAQ',
  '20-10-01': 'BENÍTEZ',
  '30-10-01': 'CASA MATRIZ',
  '30-10-07': 'PREDOSIFICADO - SAN BERNARDO',
  '30-10-08': 'ÁRIDOS SAN JOAQUÍN',
  '30-10-42': 'RAUL ALFARO',
  '30-10-43-A': 'DET NUEVO',
  '30-10-43-B': 'TALLER CANECHE',
  '30-10-43-C': 'DET NUEVO',
  '30-10-43-D': 'ESTODCADA 8',
  '30-10-44': 'DET PLANTA COLON',
  '30-10-45': 'DET PLANTA CALETONES',
  '30-10-46': 'DET AGUA DULCE',
  '30-10-48': 'DET ESMERALDA',
  '30-10-49': 'DET NP NNM',
  '30-10-50': 'DET ACH NNM',
  '30-10-52': 'LUIS CABRERA',
  '30-10-53': 'URBANO SAN BERNARDO',
  '30-10-54': 'URBANO OLIVAR',
  '30-10-55': 'DET TENIENTE',
  '30-10-57': 'CALAMA',
  '30-10-58': 'GASTÓN CASTILLO',
  '30-10-59': 'INFRAESTRUCTURA MINERA',
  '30-10-60': 'CALAMA',
  '30-10-61': 'ALTO MAIPO',
};

  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth,
    public sanitizer: DomSanitizer,
    private toastController: ToastController,

  ) {}

  ngOnInit() {
    this.cargarSiguienteNumero();
    this.cargarSolpedSolicitadas();
    this.obtenerNombreUsuarioYFiltrarSolped();
  }
cargarSolpedSolicitadas() {
  this.firestore.collection('solpes', ref =>
    ref
      .where('estatus', 'in', ['Solicitado', 'Cotizando'])
      .where('dirigidoA', 'array-contains', this.usuarioActual) // ✅ soporta múltiples cotizadores
  ).get().subscribe(snapshot => {
    this.solpedDisponibles = snapshot.docs
      .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
      .sort((a, b) => (a.numero_solpe || 0) - (b.numero_solpe || 0));
  });
}


async obtenerNombreUsuarioYFiltrarSolped() {
  const user = await this.auth.currentUser;
  const uid = user?.uid;

  if (uid) {
    const userDoc = await this.firestore.collection('Usuarios').doc(uid).get().toPromise();
    if (userDoc?.exists) {
      const data = userDoc.data() as any;
      this.usuarioActual = data.fullName || '';
      this.cargarSolpedSolicitadas();
    }
  }
}

abrirSelectorArchivos() {
  const input = document.getElementById('inputArchivo') as HTMLInputElement;
  if (input) input.click();
}
async onArchivoSeleccionado(event: any) {
  const archivosSeleccionados: File[] = Array.from(event.target.files);

  for (const archivo of archivosSeleccionados) {
    // Agregar propiedades personalizadas directamente al File
    (archivo as ArchivoConVista).tipo = archivo.type;
    (archivo as ArchivoConVista).previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      URL.createObjectURL(archivo)
    );

    this.archivos.push(archivo as ArchivoConVista);
  }
}

formatearPrecio(event: any) {
  const rawValue = event.detail.value.replace(/\D/g, '');
  const numero = Number(rawValue);
  this.precioTotalConIVA = numero;

  this.precioFormateado = numero.toLocaleString('es-CL', {
    style: 'currency',
    currency: this.moneda || 'CLP', // ✅ usar moneda seleccionada
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  this.calcularAprobador();
}



calcularAprobador() {
  let total = this.precioTotalConIVA;

  // Convertir a CLP si la moneda es distinta
  if (this.monedaSeleccionada === 'USD') {
    total = total * this.tipoCambioUSD;
  } else if (this.monedaSeleccionada === 'EUR') {
    total = total * this.tipoCambioEUR;
  }

  const empresa = this.solpedSeleccionada?.empresa?.toLowerCase() || '';

  if (empresa.includes('Xtreme mining')) {
    if (total <= 1000000) {
      this.aprobadorSugerido = 'Felipe / Ricardo';
    } else {
      this.aprobadorSugerido = 'César Palma';
    }
  } else {
    // Aplica para Xtreme Servicio y cualquier otro
    if (total <= 250000) {
      this.aprobadorSugerido = 'Guillermo Manzor';
    } else if (total <= 1000000) {
      this.aprobadorSugerido = 'Juan Cubillos';
    } else {
      this.aprobadorSugerido = 'Alejandro Candia';
    }
  }
}





eliminarArchivo(index: number) {
  this.archivos.splice(index, 1);
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
    // Validación de contenido
    if (archivo.size === 0 || !archivo.type) {
      console.warn('⚠️ Archivo inválido o vacío:', archivo);
      this.mostrarToast(`El archivo ${archivo.name} está vacío o no tiene tipo válido.`, 'warning');
      continue;
    }

    console.log(`📥 CARGADO: ${archivo.name} - ${archivo.size} bytes`);

    // Agrega propiedades extra al archivo real
    const fileConVista = archivo as ArchivoConVista;
    fileConVista.tipo = archivo.type;
    fileConVista.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(archivo));

    this.archivos.push(fileConVista);
  }

  if (this.archivos.length === 0) {
    this.mostrarToast('Ningún archivo válido fue seleccionado.', 'warning');
  }
}

async enviarOC() {
  if (this.enviando) return;

  // ✅ Validaciones
  if (!this.centroCosto.trim()) return this.mostrarToast('Debes seleccionar un Centro de Costo.', 'warning');
  if (!this.tipoCompra) return this.mostrarToast('Debes seleccionar el tipo de compra.', 'warning');
  if (this.tipoCompra === 'patente' && !this.destinoCompra.trim()) return this.mostrarToast('Debes ingresar la patente.', 'warning');
  if (!this.precioTotalConIVA || this.precioTotalConIVA <= 0) return this.mostrarToast('Debes ingresar un precio válido.', 'warning');
  if (!this.moneda) return this.mostrarToast('Debes seleccionar una moneda.', 'warning');
  if (this.archivos.length === 0) return this.mostrarToast('Debes subir al menos un archivo.', 'warning');
  if (this.usarSolped && !this.solpedSeleccionadaId) return this.mostrarToast('Selecciona una SOLPED o desactiva la opción.', 'warning');

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

  const estatusInicial = 'Revisión Guillermo';

  const historialEntry = {
    usuario,
    estatus: estatusInicial,
    fecha
  };

  const dataToSave: any = {
    id,
    centroCosto: this.centroCosto,
    centroCostoNombre: centroNombre,
    tipoCompra: this.tipoCompra,
    destinoCompra: this.tipoCompra === 'patente' ? this.destinoCompra : '',
    estatus: estatusInicial,
    fechaSubida: firebase.firestore.Timestamp.fromDate(new Date()),
    historial: [historialEntry],
    responsable: usuario,
    comentario: this.comentario || '',
    numero_contrato: this.centroCosto,
    nombre_centro_costo: centroNombre,
    moneda: this.moneda,
    precioTotalConIVA: this.precioTotalConIVA,
    aprobadorSugerido: this.aprobadorSugerido,
    archivosStorage: []
  };

  // 🔄 Subir archivos
  const archivosSubidos: any[] = [];
  const storage = getStorage();

  for (const archivo of this.archivos) {
    if (!archivo || archivo.size < 100) {
      console.warn(`⚠️ Archivo inválido o vacío: ${archivo?.name}`);
      this.mostrarToast(`El archivo ${archivo?.name} parece estar vacío.`, 'warning');
      continue;
    }

    const nombre = archivo.name || 'archivo_sin_nombre';
    const tipoDetectado = archivo.tipo || archivo.type || 'application/octet-stream';
    const path = `ordenes_oc/${id}/${nombre}`;
    const storageRef = ref(storage, path);

    try {
      const snapshot = await uploadBytes(storageRef, archivo);
      const downloadURL = await getDownloadURL(snapshot.ref);

      archivosSubidos.push({
        nombre,
        tipo: tipoDetectado,
        url: downloadURL
      });
    } catch (error) {
      console.error('❌ Error al subir archivo a Storage:', error);
      this.mostrarToast('Error al subir archivo a Storage.', 'danger');
      this.enviando = false;
      return;
    }
  }

  dataToSave.archivosStorage = archivosSubidos;

  // 🔄 Si hay SOLPED asociada
  if (this.usarSolped && this.solpedSeleccionadaId) {
    dataToSave.solpedId = this.solpedSeleccionadaId;
    dataToSave.numero_solped = this.solpedSeleccionada?.numero_solpe || 0;
    dataToSave.empresa = this.solpedSeleccionada?.empresa || 'No definida';
    dataToSave.tipo_solped = this.solpedSeleccionada?.tipo_solped || 'No definido';

    const itemsFinal = this.itemsSolped.map((item) => {
      const cantidadTotal = item.cantidad;
      const cantidadAnterior = item.cantidad_cotizada || 0;
      const cantidadNueva = Number(item.cantidad_para_cotizar || 0);
      const cantidadActualizada = cantidadAnterior + cantidadNueva;

      let nuevoEstado = 'pendiente';
      if (cantidadActualizada >= cantidadTotal) {
        nuevoEstado = 'revision'; // ✅ lógica actualizada
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

    // 🔄 Actualizar estado de la SOLPED
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
              nuevoEstado = 'revision'; // ✅ lógica actualizada
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

        // Siempre dejar estatus de SOLPED en "Cotizando" (no se marca Completado aquí)
        await this.firestore.collection('solpes').doc(this.solpedSeleccionadaId).update({
          items: itemsActualizados,
          estatus: 'Cotizando'
        });
      }
    }

    this.mostrarToast('Cotización enviada exitosamente.', 'success');

    // 🔄 Reset formulario
    this.centroCosto = '';
    this.tipoCompra = 'stock';
    this.destinoCompra = '';
    this.archivos = [];
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
