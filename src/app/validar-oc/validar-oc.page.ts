import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ToastController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { deleteObject, ref as storageRef, getStorage } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
@Component({
  selector: 'app-validar-oc',
  templateUrl: './validar-oc.page.html',
  styleUrls: ['./validar-oc.page.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ValidarOcPage implements OnInit {
  ocs: any[] = [];
  loading = true;
  nombreUsuario: string = '';

  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth,
    private sanitizer: DomSanitizer,
    private toastController: ToastController,
    private storage: AngularFireStorage,
  ) {}

async ngOnInit() {
  this.nombreUsuario = await this.obtenerNombreUsuario();
  await this.cargarOCs();
  this.cargarArchivosDesdeLocalStorage();
}


async cargarOCs() {
  this.loading = true;

  try {
    const nombreUsuario = await this.obtenerNombreUsuario();
    this.nombreUsuario = nombreUsuario;

    let estatusFiltro: string;

    // 🎯 Asignar estatus según el usuario
    switch (nombreUsuario) {
      case 'Juan Cubillos':
        estatusFiltro = 'Preaprobado';
        break;
      case 'Guillermo Manzor':
        estatusFiltro = 'Revisión Guillermo';
        break;
      case 'Alejandro Candia':
        estatusFiltro = 'Casi Aprobado';
        break;
      default:
        this.mostrarToast('Usuario no autorizado para validar OCs.', 'warning');
        this.ocs = [];
        this.loading = false;
        return;
    }

    console.log('👤 Usuario:', nombreUsuario, '| Filtro aplicado:', estatusFiltro);

    const snapshot = await this.firestore
      .collection('ordenes_oc', ref => ref.where('estatus', '==', estatusFiltro))
      .get()
      .toPromise();

    if (!snapshot) {
      this.ocs = [];
      return;
    }

    this.ocs = await Promise.all(snapshot.docs.map(async doc => {
      const data = doc.data() as any;

      const archivosStorage = data.archivosStorage || [];
      const archivosVisuales = archivosStorage.map((archivo: any, index: number) => {
        const tipo = archivo.tipo || 'application/pdf';
        const esPDF = tipo === 'application/pdf';
        const esImagen = tipo.startsWith('image/');
        const urlSanitizada = this.sanitizer.bypassSecurityTrustResourceUrl(archivo.url);

        return {
          nombre: archivo.nombre || `archivo_${index + 1}`,
          tipo,
          esPDF,
          esImagen,
          url: urlSanitizada,
          mostrar: false
        };
      });

      const historialOrdenado = (data.historial || []).sort((a: any, b: any) => {
        const fechaA = a.fecha?.toDate?.() || new Date(a.fecha) || new Date(0);
        const fechaB = b.fecha?.toDate?.() || new Date(b.fecha) || new Date(0);
        return fechaA.getTime() - fechaB.getTime();
      });

      let itemsEvaluados: any[] = [];
      if (Array.isArray(data.items)) {
        itemsEvaluados = data.items.filter((item: any) => item.estado === 'aprobado');
      }

      return {
        docId: doc.id,
        ...data,
        historial: historialOrdenado,
        archivosVisuales,
        mostrarArchivo: false,
        comentarioTemporal: '',
        itemsEvaluados,
        resumenSolpedVisible: false,
        resumenSolped: null
      };
    }));
  } catch (error) {
    console.error('❌ Error al cargar OCs:', error);
    this.ocs = [];
  } finally {
    this.loading = false;
  }
}



async verResumenSolped(oc: any) {
  if (!oc.solpedId) {
    this.mostrarToast('Esta OC no tiene una SOLPED asociada.', 'warning');
    return;
  }

  oc.detalleSolpedVisible = !oc.detalleSolpedVisible;
  if (!oc.detalleSolpedVisible) return;

  try {
    const solpedSnap = await this.firestore.collection('solpes').doc(oc.solpedId).get().toPromise();
    const solpedData = solpedSnap?.data() as any;

    if (!solpedData) {
      this.mostrarToast('No se encontró la SOLPED asociada.', 'warning');
      return;
    }

    // 🔍 Traer todas las OCs relacionadas a esta SOLPED
    const ocsSnap = await this.firestore
      .collection('ordenes_oc', ref => ref.where('solpedId', '==', oc.solpedId))
      .get()
      .toPromise();

    const ocsRelacionadas = ocsSnap?.docs.map(doc => doc.data()) || [];

    // 🔎 Extraer los items y agrupar por ID de item
    const mapaEstados: Record<string, Set<string>> = {};

    ocsRelacionadas.forEach((ocData: any) => {
      (ocData.items || []).forEach((item: any) => {
        const key = item.item?.toString();
        if (!mapaEstados[key]) mapaEstados[key] = new Set();
        if (item.estado_cotizacion) {
          mapaEstados[key].add(item.estado_cotizacion);
        }
      });
    });

    const items = (solpedData.items || []).map((item: any) => {
      const key = item.item?.toString();
      const estados = mapaEstados[key] || new Set();

      let estadoCotizacion = 'ninguno';
      if (estados.has('completo')) {
        estadoCotizacion = 'completo';
      } else if (estados.has('parcial')) {
        estadoCotizacion = 'parcial';
      }

      return {
        ...item,
        estadoCotizacion
      };
    });

    // ✅ Guardar resumen y empresa directamente
    oc.detalleSolped = {
      numero_solpe: solpedData.numero_solpe || 'N/A',
      empresa: solpedData.empresa || 'N/A',
      tipo_solped: solpedData.tipo_solped || 'N/A',
      fecha: solpedData.fecha_creacion?.toDate?.()?.toLocaleDateString() || 'N/A',
      cantidadItems: items.length,
      items,
      imagenAdjunta: solpedData.imagen_url || null
    };

    // 🔧 Asignar empresa directamente a la OC para validación posterior
    oc.empresa = solpedData.empresa || 'N/A';

  } catch (error) {
    console.error('❌ Error al cargar la SOLPED:', error);
    this.mostrarToast('Error al cargar la SOLPED.', 'danger');
  }
}




getColorEstadoCotizacion(estado: string): string {
  switch (estado) {
    case 'completo': return 'success';   // verde
    case 'parcial': return 'warning';    // amarillo
    default: return 'danger';            // rojo
  }
}



formatearCLP(valor: number): string {
  return valor?.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }) || '$0';
}

cargarArchivosDesdeLocalStorage() {
  const archivosRaw = localStorage.getItem('archivosOC');
  if (!archivosRaw) return;

  try {
    const archivos = JSON.parse(archivosRaw);
    const archivosVisuales = archivos.map((archivo: any, index: number) => {
      const tipo = archivo.tipo || 'application/pdf';
      const esPDF = tipo === 'application/pdf';
      const esImagen = tipo.startsWith('image/');

      // ✅ Usa directamente la URL si está presente
      const url = archivo.url
        ? this.sanitizer.bypassSecurityTrustResourceUrl(archivo.url)
        : this.crearArchivoUrl(archivo.base64, tipo);

      return {
        nombre: archivo.nombre || `archivo_${index + 1}`,
        tipo,
        esPDF,
        esImagen,
        mostrar: true,
        url,
        base64: archivo.base64 || null
      };
    });

    this.ocs.unshift({
      id: 'archivos-local',
      estatus: 'Desde localStorage',
      centroCosto: 'Local',
      centroCostoNombre: '',
      fechaSubida: new Date(),
      destinoCompra: '',
      tipo_solped: '',
      nombre_centro_costo: '',
      responsable: 'Sistema',
      precioTotalConIVA: 0,
      archivosVisuales,
      itemsEvaluados: [],
      comentarioTemporal: ''
    });

  } catch (error) {
    console.error('Error al leer archivos desde localStorage:', error);
  }
}

verArchivoIndividual(archivo: any) {
  archivo.mostrar = true;

  if (archivo.tipo?.includes('pdf')) {
    archivo.esPDF = true;
    archivo.esImagen = false;
  } else if (archivo.tipo?.startsWith('image')) {
    archivo.esImagen = true;
    archivo.esPDF = false;
  }

  // Solo sanitizar si es string plano
  if (typeof archivo.url === 'string') {
    archivo.url = this.sanitizer.bypassSecurityTrustResourceUrl(archivo.url);
  } else {
  }
}



async eliminarArchivoDeOC(oc: any, archivoIndex: number) {
  if (oc.archivosStorage.length <= 1) {
    this.mostrarToast('Debe mantener al menos un archivo.', 'warning');
    return;
  }

  const archivoAEliminar = oc.archivosStorage[archivoIndex];

  try {
    // 1. Eliminar de Firebase Storage
    const storageRef = this.storage.refFromURL(archivoAEliminar.url);
    await storageRef.delete().toPromise();

    // 2. Eliminar del array
    const nuevosArchivos = oc.archivosStorage.filter((_: unknown, i: number) => i !== archivoIndex);


    // 3. Actualizar en Firestore
    await this.firestore.collection('ordenes_oc').doc(oc.docId).update({
      archivosStorage: nuevosArchivos
    });

    // 4. Actualizar en frontend
    oc.archivosStorage = nuevosArchivos;

    this.mostrarToast('Archivo eliminado correctamente.', 'success');
  } catch (error) {
    console.error('❌ Error al eliminar archivo:', error);
    this.mostrarToast('Error al eliminar archivo.', 'danger');
  }
}


  crearArchivoUrl(base64: string, tipo: string): SafeResourceUrl {
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

    const blob = new Blob(byteArrays, { type: tipo });
    const url = URL.createObjectURL(blob);

    return tipo === 'application/pdf'
      ? this.sanitizer.bypassSecurityTrustResourceUrl(url)
      : this.sanitizer.bypassSecurityTrustUrl(url);
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

  async obtenerNombreUsuario(): Promise<string> {
    const user = await this.auth.currentUser;
    const uid = user?.uid;
    if (!uid) return 'Desconocido';

    const userDoc = await this.firestore.collection('Usuarios').doc(uid).get().toPromise();
    const data = userDoc?.data() as { fullName?: string };
    return data?.fullName || 'Desconocido';
  }

async aprobarOC(oc: any) {
  const comentario = oc.comentarioTemporal?.trim();
  if (!comentario) {
    this.mostrarToast('Por favor escribe un comentario antes de aprobar.', 'warning');
    return;
  }

  const usuario = await this.obtenerNombreUsuario();
  const fecha = new Date().toISOString();
  const monto = oc.precioTotalConIVA || 0;

  let empresa = (oc.empresa || '').trim();

  // ✅ Si la empresa no está aún en la OC, obtenerla desde la SOLPED
  if (!empresa && oc.solpedId) {
    try {
      const solpedSnap = await this.firestore.collection('solpes').doc(oc.solpedId).get().toPromise();
      const solpedData = solpedSnap?.data() as any;

      if (solpedData?.empresa) {
        empresa = solpedData.empresa.trim();
        oc.empresa = empresa; // actualizar en la OC local para uso futuro
      } else {
        this.mostrarToast('La SOLPED asociada no tiene empresa definida.', 'warning');
        return;
      }
    } catch (error) {
      console.error('❌ Error obteniendo empresa desde SOLPED:', error);
      this.mostrarToast('Error al obtener empresa desde SOLPED.', 'danger');
      return;
    }
  }

  if (!empresa) {
    this.mostrarToast(`Empresa no reconocida para aprobación.`, 'warning');
    return;
  }

  let estatusFinal = 'Aprobado';

  // 🧠 Lógica por empresa
  if (empresa === 'Xtreme Mining') {
    switch (usuario) {
      case 'Guillermo Manzor':
      case 'Felipe Gonzalez':
      case 'Ricardo Santibañez':
        estatusFinal = monto >= 1000000 ? 'Revisión Mining' : 'Aprobado';
        break;
      case 'Patricio Muñoz':
        estatusFinal = monto <= 2000000 ? 'Aprobado' : 'Escalado César Palma';
        break;
      case 'Cesar Palma':
        estatusFinal = monto > 2000000 ? 'Aprobado' : 'Pendiente';
        break;
      case 'Juan Cubillos':
        estatusFinal = monto <= 5000000 ? 'Aprobado' : 'Casi Aprobado';
        break;
      case 'Alejandro Candia':
        estatusFinal = 'Aprobado';
        break;
      default:
        this.mostrarToast('Usuario no autorizado para validar OCs de Xtreme Mining.', 'warning');
        return;
    }

  } else if (empresa === 'Xtreme Servicio') {
    switch (usuario) {
      case 'Guillermo Manzor':
        estatusFinal = monto <= 1000000 ? 'Aprobado' : 'Preaprobado';
        break;
      case 'Juan Cubillos':
        estatusFinal = monto <= 5000000 ? 'Aprobado' : 'Casi Aprobado';
        break;
      case 'Alejandro Candia':
        estatusFinal = 'Aprobado';
        break;
      default:
        this.mostrarToast('Usuario no autorizado para validar OCs de Xtreme Servicio.', 'warning');
        return;
    }
  } else {
    this.mostrarToast(`Empresa ${empresa} no reconocida para aprobación.`, 'warning');
    return;
  }

  // 📜 Guardar historial
  const nuevoHistorial = [...(oc.historial || []), {
    usuario,
    estatus: estatusFinal,
    fecha,
    comentario
  }];

  const datosActualizados: any = {
    estatus: estatusFinal,
    historial: nuevoHistorial
  };

  if (oc.numero_solped) datosActualizados.numero_solped = oc.numero_solped;
  if (empresa) datosActualizados.empresa = empresa;

  await this.firestore.collection('ordenes_oc').doc(oc.docId).update(datosActualizados);

  // 🔄 Actualizar ítems en la SOLPED si corresponde
  if (oc.solpedId) {
    const solpedRef = this.firestore.collection('solpes').doc(oc.solpedId);
    const solpedSnap = await solpedRef.get().toPromise();
    const solpedData = solpedSnap?.data() as any;

    if (solpedData?.items?.length > 0) {
      const itemsActualizados = solpedData.items.map((item: any) => {
        const cotizado = item.cantidad_cotizada || 0;
        const total = item.cantidad || 0;

        let nuevoEstado = 'pendiente';
        if (cotizado >= total) {
          nuevoEstado = 'completado';
        } else if (cotizado > 0) {
          nuevoEstado = 'parcial';
        }

        return { ...item, estado: nuevoEstado };
      });

      const todosCompletados = itemsActualizados.every((item: any) => item.estado === 'completado');

      await solpedRef.update({
        items: itemsActualizados,
        estatus: todosCompletados ? 'Completado' : solpedData.estatus
      });
    }
  }

  // 🧹 Quitar del array de la vista
  this.ocs = this.ocs.filter(item => item.docId !== oc.docId);
  this.mostrarToast(`OC aprobada por ${usuario} con estatus: ${estatusFinal}`, 'success');
}





async rechazarOC(oc: any) {
  const comentario = oc.comentarioTemporal?.trim();
  if (!comentario) {
    this.mostrarToast('Por favor escribe un comentario antes de rechazar.', 'warning');
    return;
  }

  const usuario = await this.obtenerNombreUsuario();
  const fecha = new Date().toISOString();

  const nuevoHistorial = [...(oc.historial || []), {
    usuario,
    estatus: 'Rechazado',
    fecha,
    comentario
  }];

  // 1. Cambiar estado de la OC a "Rechazado"
  await this.firestore.collection('ordenes_oc').doc(oc.docId).update({
    estatus: 'Rechazado',
    historial: nuevoHistorial
  });

  // 2. Cambiar ítems aprobados de vuelta a "pendiente" en la SOLPED
  if (oc.solpedId && oc.itemsEvaluados?.length > 0) {
    const solpedRef = this.firestore.collection('solpes').doc(oc.solpedId);
    const solpedSnap = await solpedRef.get().toPromise();
    const solpedData = solpedSnap?.data() as any;

    if (solpedData?.items) {
      const itemsActualizados = solpedData.items.map((item: any) => {
        const fueSeleccionado = oc.itemsEvaluados.some((i: any) => i.item === item.item);
        if (fueSeleccionado && item.estado === 'aprobado') {
          return { ...item, estado: 'pendiente' };
        }
        return item;
      });

      await solpedRef.update({ items: itemsActualizados });
    }
  }

  // 3. Eliminar del listado actual
  this.ocs = this.ocs.filter(item => item.docId !== oc.docId);
  this.mostrarToast('OC rechazada y los ítems fueron devueltos a pendiente.', 'danger');
}
async solicitarAclaracion(oc: any) {
  const comentario = oc.comentarioTemporal?.trim();
  if (!comentario) {
    this.mostrarToast('Por favor escribe un comentario antes de solicitar aclaración.', 'warning');
    return;
  }

  const usuario = await this.obtenerNombreUsuario();
  const fecha = new Date().toISOString();

  const nuevoHistorial = [...(oc.historial || []), {
    usuario,
    estatus: 'Pendiente de Aprobación',
    fecha,
    comentario
  }];

  // Actualiza el estatus en Firestore
  await this.firestore.collection('ordenes_oc').doc(oc.docId).update({
    estatus: 'Pendiente de Aprobación',
    historial: nuevoHistorial
  });

  // Elimina del listado actual
  this.ocs = this.ocs.filter(item => item.docId !== oc.docId);
  this.mostrarToast('Solicitud de aclaración enviada.', 'warning');
}

getColorByEstado(estado: string): string {
  switch (estado) {
    case 'aprobado': return 'success';
    case 'rechazado': return 'danger';
    case 'pendiente': return 'warning';
    default: return 'medium';
  }
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
