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
  empresaPorDefecto: string = 'Xtreme Servicio';
  autorizacionNombre: string | null = null;
  autorizacionUrlRaw: string | null = null;
  autorizacionSafeUrl: SafeResourceUrl | null = null;
  autorizacionEsPDF = false;
  autorizacionEsImagen = false;
  autorizacionExt = '';
  isCentroOpen = false;
  centroEvent: any;
  centrosFiltrados: { key: string; name: string }[] = [];
  filtroCentro = '';
  centrosCostoLista: { key: string; name: string }[] = [
    { key: '27483', name: 'CONTRATO 27483 SUM. HORMIGON CHUCHICAMATA' },
    { key: 'PPCALAMA', name: 'PLANTA PREDOSIFICADO CALAMA' },
    { key: '20915', name: 'CONTRATO 20915 SUM. HORMIGON DAND' },
    { key: '23302-CARPETAS', name: 'CONTRATO 23302 CARPETAS' },
    { key: '23302-AMPL', name: 'CONTRATO 23302 AMPLIACION' },
    { key: 'OFANDES', name: 'OFICINA LOS ANDES' },
    { key: 'CASAMATRIZ', name: 'CASA MATRIZ' },
    { key: 'RRHH', name: 'RRHH' },
    { key: 'FINANZAS', name: 'FINANZAS' },
    { key: 'SUST', name: 'SUSTENTABILIDAD' },
    { key: 'SOPTI', name: 'SOPORTE TI' },
    { key: 'STRIPCENTER', name: 'STRIP CENTER' },
    { key: 'PLANIF', name: 'PLANIFICACION' },
    { key: 'PPSB', name: 'PLANTA PREDOSIFICADO SAN BERNARDO' },
    { key: 'PHUSB', name: 'PLANTA HORMIGON URB.SAN BERNARDO' },
    { key: 'ALTOMAIPO', name: 'ALTO MAIPO' },
    { key: 'PHURAN', name: 'PLANTA HORMIGON URB. RANCAGUA' },
    { key: 'PARAN', name: 'PLANTA ARIDOS RANCAGUA' },
    { key: 'PASB', name: 'PLANTA ARIDOS SAN BERNARDO' },
    { key: '22368', name: 'CONTRATO 22368 SUM HORMIGON DET' },
    { key: '28662', name: 'CONTRATO 28662 CARPETAS' },
    { key: '29207', name: 'CONTRATO 29207 MINERIA' },
    { key: 'HORMIGONES DET', name: 'CONTRATO SUMINISTRO DE HORMIGONES DET' },
    { key: 'HORMIGONES DAND', name: 'CONTRATO SUMINISTRO DE HORMIGONES DAND' },
    { key: '23302', name: 'CONTRATO MANTENCIÓN Y REPARACIÓN DE INFRAESTRUCTURA DAND' },
    { key: 'DET', name: 'CONTRATO REPARACIÓN DE CARPETAS DE RODADO DET' },
    { key: 'SANJOAQUIN', name: 'SERVICIO PLANTA DE ÁRIDOS SAN JOAQUÍN' },
    { key: 'URBANOS', name: 'SUMINISTRO DE HORMIGONES URBANOS SAN BERNARDO Y OLIVAR' },
    { key: 'CS', name: 'CONTRATO DE SUMINISTRO DE HORMIGONES CS' },
    { key: 'PREDOSIFICADO', name: 'CONTRATO HORMIGONES Y PREDOSIFICADO' },
    { key: 'CANECHE', name: 'CONTRATO TALLER CANECHE' },
    { key: 'INFRAESTRUCTURA', name: 'CONTRATO INFRAESTRUCTURA DET' },
    { key: 'CHUQUICAMATA', name: 'CONTRATO CHUQUICAMATA' },
    { key: 'CARPETASDET', name: 'CONTRATO CARPETAS DET' },
    { key: '30-10-11', name: 'GCIA. SERV. OBRA PAVIMENTACION RT CONTRATO FAM' },

    // 👇 Ejemplos de duplicados (si los necesitas)
    { key: '28662', name: 'CONTRATO 28662 CARPETAS' },
    { key: '23302', name: 'CONTRATO MANTENCIÓN Y REPARACIÓN DE INFRAESTRUCTURA DAND' },
  ];
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
    this.centrosFiltrados = this.centrosCostoLista.slice();
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
openCentro(ev: any) {
  this.centroEvent = ev;
  this.isCentroOpen = true;
  this.filtroCentro = '';
  this.centrosFiltrados = this.centrosCostoLista.slice(); // 👈 muestra TODOS (incluye repetidos)
}

filtrarCentros() {
  const f = (this.filtroCentro || '').toLowerCase();
  this.centrosFiltrados = !f
    ? this.centrosCostoLista.slice()
    : this.centrosCostoLista.filter(c =>
        c.key.toLowerCase().includes(f) || c.name.toLowerCase().includes(f)
      );
}
get nombreCentroCosto(): string {
  // Si tienes la lista (permite duplicados)
  if (Array.isArray(this.centrosCostoLista) && this.centrosCostoLista.length) {
    const found = this.centrosCostoLista.find(c => c.key === this.centroCosto);
    if (found?.name) return found.name;
  }
  // Fallback: usa el objeto map que ya tienes
  return (this as any).centrosCosto?.[this.centroCosto] ?? '';
}
seleccionarCentro(c: { key: string; name: string }) {
  this.centroCosto = c.key;
  this.isCentroOpen = false;
  this.filtroCentro = '';
  this.centrosFiltrados = this.centrosCostoLista.slice();
}
private setAutorizacionDesdeSolped(solped: any) {
  this.autorizacionNombre = solped?.autorizacion_nombre || null;
  this.autorizacionUrlRaw = solped?.autorizacion_url || null;

  // reset
  this.autorizacionEsPDF = false;
  this.autorizacionEsImagen = false;
  this.autorizacionSafeUrl = null;
  this.autorizacionExt = '';

  if (!this.autorizacionUrlRaw) return;

  // Detectar extensión
  const nombre = (this.autorizacionNombre || '').toLowerCase();
  const urlLower = this.autorizacionUrlRaw.toLowerCase();
  const guess = (nombre || urlLower);
  this.autorizacionExt = guess.split('.').pop() || '';

  this.autorizacionEsPDF = guess.endsWith('.pdf');
  this.autorizacionEsImagen = /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(guess);

  // Para previsualización segura
  if (this.autorizacionEsPDF || this.autorizacionEsImagen) {
    // Para PDF, puedes añadir #toolbar=0 si quieres ocultar la barra
    const urlParaIframe = this.autorizacionEsPDF
      ? `${this.autorizacionUrlRaw}#toolbar=0`
      : this.autorizacionUrlRaw;

    this.autorizacionSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlParaIframe);
  }
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
  // 1) Parsear solo números del input (ion-input entrega event.detail.value)
  const input = (event?.detail?.value ?? '').toString();
  const soloNumeros = input.replace(/\D/g, '');
  const valor = soloNumeros ? parseInt(soloNumeros, 10) : 0;

  // 2) Guardar el valor crudo
  this.precioTotalConIVA = valor;

  // 3) Formato visual según moneda seleccionada
  const moneda = this.monedaSeleccionada || 'CLP';
  this.precioFormateado = valor.toLocaleString('es-CL', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  // 4) (Opcional) Si quieres tener el total convertido a CLP aquí mismo:
  //    *No* es obligatorio si tu calcularAprobador ya convierte internamente.
  let totalEnCLP = valor;
  if (this.monedaSeleccionada === 'USD') totalEnCLP = valor * this.tipoCambioUSD;
  else if (this.monedaSeleccionada === 'EUR') totalEnCLP = valor * this.tipoCambioEUR;
  else if (this.monedaSeleccionada === 'UF' && (this as any).tipoCambioUF) {
    totalEnCLP = valor * (this as any).tipoCambioUF; // solo si definiste tipoCambioUF
  }
  // this.totalConvertidoCLP = totalEnCLP; // <- si quieres guardarlo

  // 5) Recalcular aprobador con el nuevo valor/moneda
  this.calcularAprobador();
}



calcularAprobador() {
  let total = this.precioTotalConIVA;

  if (this.moneda === 'USD') total = total * this.tipoCambioUSD;
  else if (this.moneda === 'EUR') total = total * this.tipoCambioEUR;

  // 👇 si NO usa SOLPED, fuerza 'Xtreme Servicio'
  const empresaBase = this.usarSolped
    ? (this.solpedSeleccionada?.empresa || this.empresaPorDefecto)
    : this.empresaPorDefecto;

  const empresa = (empresaBase || '').toLowerCase();

  if (empresa === 'xtreme mining') {
    if (total <= 1000000) this.aprobadorSugerido = 'Felipe Gonzalez / Ricardo Santibañez / Guillermo Manzor';
    else if (total <= 2000000) this.aprobadorSugerido = 'Patricio Muñoz';
    else if (total <= 5000000) this.aprobadorSugerido = 'Juan Cubillos';
    else this.aprobadorSugerido = 'Alejandro Candia';
  } else if (empresa === 'xtreme servicio') {
    if (total <= 250000) this.aprobadorSugerido = 'Guillermo Manzor';
    else if (total <= 5000000) this.aprobadorSugerido = 'Juan Cubillos';
    else this.aprobadorSugerido = 'Alejandro Candia';
  } else {
    this.aprobadorSugerido = 'Empresa no reconocida';
  }
}

onToggleUsarSolped() {
  if (!this.usarSolped) {
    this.solpedSeleccionada = null;
    this.solpedSeleccionadaId = '';
    this.itemsSolped = [];
    // limpiar autorización
    this.autorizacionNombre = null;
    this.autorizacionUrlRaw = null;
    this.autorizacionSafeUrl = null;
    this.autorizacionEsPDF = false;
    this.autorizacionEsImagen = false;
    this.autorizacionExt = '';
  }
  this.calcularAprobador();
}



eliminarArchivo(index: number) {
  this.archivos.splice(index, 1);
  this.mostrarToast('Archivo eliminado correctamente.', 'success');
}

onChangeSolped() {
  if (!this.solpedSeleccionadaId) {
    // limpiar si deseleccionan
    this.solpedSeleccionada = null;
    this.itemsSolped = [];
    this.autorizacionNombre = null;
    this.autorizacionUrlRaw = null;
    this.autorizacionSafeUrl = null;
    this.autorizacionEsPDF = false;
    this.autorizacionEsImagen = false;
    this.autorizacionExt = '';
    return;
  }

  this.firestore.collection('solpes').doc(this.solpedSeleccionadaId).get().subscribe(doc => {
    const data: any = doc.data();
    this.solpedSeleccionada = data;

    // 👇 mover aquí
    this.setAutorizacionDesdeSolped(this.solpedSeleccionada);

    this.centroCosto = data.numero_contrato || '';
    const todosItems = data.items || [];

    this.itemsSolped = todosItems
      .filter((item: any) => item.estado !== 'completado')
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

  // 👇 Solo exigimos SOLPED si el checkbox está marcado
  if (this.usarSolped && !this.solpedSeleccionadaId) {
    return this.mostrarToast('Selecciona una SOLPED o desactiva la opción.', 'warning');
  }

  if (this.archivos.length === 0) return this.mostrarToast('Debes subir al menos un archivo.', 'warning');

  this.enviando = true;

  try {
    // 👤 Usuario actual
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
    const centroEncontrado = this.centrosCostoLista.find(c => c.key === this.centroCosto);
    const centroNombre = centroEncontrado ? centroEncontrado.name : 'Desconocido';

    // 📌 Empresa final (de SOLPED o por defecto) — SIEMPRE definida
    const empresaElegida = (this.usarSolped && this.solpedSeleccionada?.empresa)
      ? this.solpedSeleccionada.empresa
      : this.empresaPorDefecto; // <-- 'Xtreme Servicio' por defecto

    // 🔁 Recalcular aprobador en base a la empresa y monto/moneda actuales
    // Si tu calcularAprobador usa el estado del checkbox, basta con llamarla:
    this.calcularAprobador();
    let aprobadorSugerido = this.aprobadorSugerido;

    // 🔹 Lógica especial para Felipe y Ricardo
    let estatusInicial = 'Revisión Guillermo';
    if (usuario === 'Felipe Gonzalez' || usuario === 'Ricardo Santibañez') {
      if (this.precioTotalConIVA <= 1000000) {
        estatusInicial = 'Aprobado';
        aprobadorSugerido = usuario;
      } else if (this.precioTotalConIVA <= 2000000) {
        estatusInicial = 'Preaprobado';
        aprobadorSugerido = 'Patricio Muñoz';
      } else {
        estatusInicial = 'Escalado César Palma';
        aprobadorSugerido = 'César Palma';
      }
    }

    const historialEntry = { usuario, estatus: estatusInicial, fecha };

    // 🧾 Objeto a guardar
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
      moneda: this.moneda, // usa la misma variable que usas en el form
      precioTotalConIVA: this.precioTotalConIVA,
      aprobadorSugerido,
      empresa: empresaElegida,  // 👈 SIEMPRE guarda la empresa correcta
      archivosStorage: []
    };

    // ☁️ Subir archivos a Storage
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

      const snapshot = await uploadBytes(storageRef, archivo);
      const downloadURL = await getDownloadURL(snapshot.ref);
      archivosSubidos.push({ nombre, tipo: tipoDetectado, url: downloadURL });
    }

    dataToSave.archivosStorage = archivosSubidos;

    // 🔄 Si hay SOLPED asociada (checkbox marcado)
    if (this.usarSolped && this.solpedSeleccionadaId) {
      dataToSave.solpedId = this.solpedSeleccionadaId;
      dataToSave.numero_solped = this.solpedSeleccionada?.numero_solpe || 0;
      dataToSave.tipo_solped = this.solpedSeleccionada?.tipo_solped || 'No definido';

      // Items a guardar dentro de la OC (resumen de lo cotizado)
      const itemsFinal = this.itemsSolped.map((item) => {
        const cantidadTotal = item.cantidad;
        const cantidadAnterior = item.cantidad_cotizada || 0;
        const cantidadNueva = Number(item.cantidad_para_cotizar || 0);
        const cantidadActualizada = cantidadAnterior + cantidadNueva;

        let nuevoEstado = 'pendiente';
        let estadoCotizacion = 'ninguno';

        if (cantidadActualizada >= cantidadTotal) {
          nuevoEstado = 'revision';
          estadoCotizacion = 'completo';
        } else if (cantidadNueva > 0) {
          nuevoEstado = 'parcial';
          estadoCotizacion = 'parcial';
        }

        return {
          ...item,
          cantidad_cotizada: cantidadActualizada,
          cantidad_para_cotizar: cantidadNueva,
          estado: nuevoEstado,
          estado_cotizacion: estadoCotizacion
        };
      });

      dataToSave.items = itemsFinal;
    } else {
      // 👇 Sin SOLPED asociada
      dataToSave.tipo_solped = 'Sin SOLPED';
    }

    // 📝 Guardar OC
    await this.firestore.collection('ordenes_oc').add(dataToSave);

    // 🔁 Actualizar la SOLPED solo si hay asociación
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
            let estadoCotizacion = 'ninguno';

            if (cantidadFinal >= cantidadTotal) {
              nuevoEstado = 'revision';
              estadoCotizacion = 'completo';
            } else if (cantidadNueva > 0) {
              nuevoEstado = 'parcial';
              estadoCotizacion = 'parcial';
            }

            return {
              ...item,
              cantidad_cotizada: cantidadFinal,
              estado: nuevoEstado,
              estado_cotizacion: estadoCotizacion
            };
          }
          return item;
        });

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
    this.usarSolped = true; // si prefieres conservar el estado del checkbox, elimina esta línea
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
