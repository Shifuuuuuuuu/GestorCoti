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
    const estatusFiltro = 'Revisión Guillermo'; // 🔁 Todos pasan por aquí

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

    if (solpedData) {
      oc.detalleSolped = {
        numero_solpe: solpedData.numero_solpe || 'N/A',
        empresa: solpedData.empresa || 'N/A',
        tipo_solped: solpedData.tipo_solped || 'N/A',
        fecha: solpedData.fecha_creacion?.toDate?.()?.toLocaleDateString() || 'N/A',
        cantidadItems: solpedData.items?.length || 0,
        items: solpedData.items || [],
        imagenAdjunta: solpedData.imagen_url || null
      };
    } else {
      this.mostrarToast('No se encontró la SOLPED asociada.', 'warning');
    }
  } catch (error) {
    console.error('❌ Error al cargar la SOLPED:', error);
    this.mostrarToast('Error al cargar la SOLPED.', 'danger');
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

  // ✅ Lógica para determinar el estatus según monto y usuario
  let estatusFinal = 'Aprobado';

  if (usuario === 'Juan Cubillos') {
    estatusFinal = 'Aprobado'; // Juan aprueba directamente
  } else if (oc.precioTotalConIVA > 250000) {
    estatusFinal = 'Preaprobado';
  } else if (usuario === 'Alejandro Candia') {
    estatusFinal = 'Casi Aprobado';
  } else if (usuario === 'Guillermo Contreras') {
    estatusFinal = 'Revisión Guillermo';
  }


  const nuevoHistorial = [...(oc.historial || []), {
    usuario,
    estatus: estatusFinal,
    fecha,
    comentario
  }];

  const asociadaASolped = !!oc.solpedId || !!oc.numero_solped;

  if (asociadaASolped && (!oc.numero_solped || !oc.empresa)) {
    this.mostrarToast('Faltan datos de número SOLPED o empresa en esta OC asociada.', 'warning');
    return;
  }

  const datosActualizados: any = {
    estatus: estatusFinal,
    historial: nuevoHistorial
  };

  if (oc.numero_solped) datosActualizados.numero_solped = oc.numero_solped;
  if (oc.empresa) datosActualizados.empresa = oc.empresa;

  await this.firestore.collection('ordenes_oc').doc(oc.docId).update(datosActualizados);

  // Eliminar del listado visual
  this.ocs = this.ocs.filter(item => item.docId !== oc.docId);

  const mensajeFinal =
    {
      'Casi Aprobado': 'OC marcada como "Casi Aprobado" por Alejandro Candia.',
      'Preaprobado': 'OC enviada a revisión de Juan Cubillos por superar los $250.000 CLP.',
      'Revisión Guillermo': 'OC marcada como "Revisión Guillermo".',
      'Aprobado': 'OC aprobada correctamente.'
    }[estatusFinal] || 'OC aprobada.';

  this.mostrarToast(mensajeFinal, 'success');
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
