import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ToastController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';
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

  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth,
    private sanitizer: DomSanitizer,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.cargarOCs();
  }

async cargarOCs() {
  this.loading = true;
  try {
    const snapshot = await this.firestore
      .collection('ordenes_oc', ref => ref.where('estatus', '==', 'Preaprobado'))
      .get()
      .toPromise();

    if (!snapshot) {
      this.ocs = [];
      return;
    }

    this.ocs = await Promise.all(snapshot.docs.map(async doc => {
      const data = doc.data() as any;
      const archivosBase64 = data.archivosBase64 || [];

      const archivosVisuales = archivosBase64.map((archivo: any, index: number) => {
        const tipo = archivo.tipo || 'application/pdf';
        const base64 = archivo.base64 || '';
        const esPDF = tipo === 'application/pdf';
        const esImagen = tipo.startsWith('image/');
        return {
          nombre: archivo.nombre || `archivo_${index + 1}`,
          base64,
          tipo,
          esPDF,
          esImagen,
          mostrar: false,
          url: null
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
        itemsEvaluados
      };
    }));
  } catch (error) {
    console.error('Error al cargar OCs:', error);
    this.ocs = [];
  } finally {
    this.loading = false;
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


  verArchivo(oc: any) {
    if (!oc.mostrarArchivo && oc.archivoBase64) {
      const tipo = oc.esPDF ? 'application/pdf' : (oc.esImagen ? 'image/png' : 'application/octet-stream');
      oc.archivoUrl = this.crearArchivoUrl(oc.archivoBase64, tipo);
      oc.mostrarArchivo = true;
    }
  }
verArchivoIndividual(archivo: any) {
  const tipo = archivo.tipo || 'application/pdf';
  const base64 = archivo.base64;

  const url = this.crearArchivoUrl(base64, tipo);
  archivo.url = url;
  archivo.mostrar = true;
}
async eliminarArchivoDeOC(oc: any, archivoIndex: number) {
  if (oc.archivosVisuales.length <= 1) {
    this.mostrarToast('Debe mantener al menos un archivo.', 'warning');
    return;
  }

  oc.archivosVisuales.splice(archivoIndex, 1);
  const nuevosArchivosBase64 = oc.archivosVisuales.map((archivo: any) => ({
    nombre: archivo.nombre,
    base64: archivo.base64,
    tipo: archivo.tipo
  }));

  await this.firestore.collection('ordenes_oc').doc(oc.docId).update({
    archivosBase64: nuevosArchivosBase64
  });

  this.mostrarToast('Archivo eliminado correctamente.', 'success');
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

  const nuevoHistorial = [...(oc.historial || []), {
    usuario,
    estatus: 'Aprobado',
    fecha,
    comentario
  }];

  // 1. Actualiza el estado de la OC principal
  await this.firestore.collection('ordenes_oc').doc(oc.docId).update({
    estatus: 'Aprobado',
    historial: nuevoHistorial
  });



  // 3. Eliminar del listado visual
  this.ocs = this.ocs.filter(item => item.docId !== oc.docId);
  this.mostrarToast('OC aprobada y guardada en SOLPED.', 'success');
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
