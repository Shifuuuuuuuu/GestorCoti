import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ToastController } from '@ionic/angular';
import 'firebase/compat/firestore';
import {trigger,transition,style,animate} from '@angular/animations';
import { AngularFireStorage } from '@angular/fire/compat/storage'; // Asegúrate de importar
import { finalize } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import { ViewChild } from '@angular/core';
import { IonContent } from '@ionic/angular';
@Component({
  selector: 'app-gestor-oc',
  templateUrl: './gestor-oc.page.html',
  styleUrls: ['./gestor-oc.page.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]

})

export class GestorOcPage implements OnInit {
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  filtroFecha: string = '';
  filtroEstatus: string[] = [];
  filtroContrato: string[] = [];
  filtroUsuario: string[] = [];
  filtroEmpresa: string[] = [];
  listaEstatus: string[] = ['Aprobado', 'Enviada a proveedor'];
  listaUsuarios = [
  { fullName: 'Daniela Lizama' },
  { fullName: 'María José Ballesteros' },
  { fullName: 'Luis Orellana' },
  { fullName: 'Guillermo Manzor' }
];
  busquedaGeneral: string = '';
  ocs: any[] = [];
  busquedaId: string = '';
  ocsOriginal: any[] = [];
  archivoSeleccionado: File | null = null;
  nombreArchivoSeleccionado: string | null = null;
  vistaPreviaPdf: SafeResourceUrl | null = null;
  archivosSeleccionados: { [key: string]: File } = {};
  nombresArchivos: { [key: string]: string } = {};
  vistasPreviasPdf: { [key: string]: SafeResourceUrl } = {};
  limite = 100;
  ultimoDoc: any = null;
  cargandoMas = false;
  puedeCargarMas = true;
  suscripcionOCs: any;
  mostrarFiltros: boolean = false;
  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth,
    private sanitizer: DomSanitizer,
    private toastController: ToastController,
    private storage: AngularFireStorage,
  ) {}

  ngOnInit() {
    this.cargarOCs();
  }
buscarPorId() {
  const busqueda = this.busquedaId.trim().toLowerCase();
  if (busqueda === '') {
    this.ocs = [...this.ocsOriginal];
  } else {
  this.ocs = this.ocsOriginal.filter(oc => {
    return oc.id?.toString() === busqueda;
  });
  }
}


async cargarOCs() {
  const user = await this.auth.currentUser;
  const uid = user?.uid;
  if (!uid) return;

  const userDoc = await this.firestore.collection('Usuarios').doc(uid).get().toPromise();
  const dataUser = userDoc?.data() as any;
  const nombreUsuario = dataUser?.fullName || '';
  const verSoloPropias = ['Luis Orellana', 'Daniela', 'Guillermo Manzor'].includes(nombreUsuario);

  const ref = this.firestore.collection('ordenes_oc', ref => {
    let query = ref.where('estatus', '==', 'Aprobado');

    if (verSoloPropias) {
      query = query.where('responsable', '==', nombreUsuario);
    }

    query = query.orderBy('id', 'desc')  // <-- siempre al final
                 .limit(this.limite);

    return query;
  });

  const snapshot = await ref.get().toPromise();
  if (!snapshot || snapshot.empty) {
    this.ocs = [];
    this.ocsOriginal = [];
    this.puedeCargarMas = false;
    return;
  }

  const cotizaciones = snapshot.docs.map(doc => {
    const data = doc.data() as any;
    return {
      id: data.id,
      docId: doc.id,
      estatus: data.estatus,
      responsable: data.responsable,
      centroCosto: data.centroCosto,
      centroCostoNombre: data.centroCostoNombre,
      destinoCompra: data.destinoCompra,
      solpedId: data.solpedId || null,
      fechaFormateada: data.fechaSubida?.toDate?.() ?? null,
      archivoOC: data.archivoOC || null,
      nombreArchivoOC: data.archivoOC?.nombre || null,
      nombrePDF: data.archivosPDF?.nombre || null
    };
  });

  this.ocs = cotizaciones;
  this.ocsOriginal = cotizaciones;
  this.ultimoDoc = snapshot.docs[snapshot.docs.length - 1] || null;
  this.puedeCargarMas = snapshot.docs.length === this.limite;
}


filtrarOCs() {
  const normalizar = (str: string) => str?.toString().toLowerCase().trim();

  this.ocs = this.ocsOriginal.filter(oc => {
    const fechaOC = oc.fechaFormateada ? new Date(oc.fechaFormateada).toISOString().slice(0, 10) : '';

    const coincideFecha = this.filtroFecha ? fechaOC === this.filtroFecha : true;
    const coincideEstatus = this.filtroEstatus.length ? this.filtroEstatus.includes(oc.estatus) : true;
    const coincideUsuario = this.filtroUsuario.length ? this.filtroUsuario.includes(oc.responsable) : true;
    const coincideContrato = this.filtroContrato.length ? this.filtroContrato.includes(oc.centroCosto) : true;
    const coincideEmpresa = this.filtroEmpresa.length ? this.filtroEmpresa.includes(oc.empresa) : true;

    // 🔍 Campos incluidos en la búsqueda general
    const campos = [
      oc.id,
      oc.estatus,
      oc.responsable,
      oc.centroCosto,
      oc.centroCostoNombre,
      oc.destinoCompra,
      oc.nombreArchivoOC,
      oc.nombrePDF,
      oc.solpedId,
      fechaOC
    ];

    const texto = campos.map(c => normalizar(c)).join(' ');
    const coincideBusqueda = this.busquedaGeneral ? texto.includes(normalizar(this.busquedaGeneral)) : true;

    return coincideFecha && coincideEstatus && coincideUsuario && coincideContrato && coincideEmpresa && coincideBusqueda;
  });
}
scrollToTop() {
  this.content.scrollToTop(500); // 500 ms de animación
}

scrollToBottom() {
  this.content.scrollToBottom(500);
}


limpiarFiltros() {
  this.filtroFecha = '';
  this.filtroEstatus = [];
  this.filtroContrato = [];
  this.filtroUsuario = [];
  this.filtroEmpresa = [];
  this.busquedaGeneral = '';
  this.ocs = [...this.ocsOriginal];
}


async cargarMasOCs() {
  if (!this.ultimoDoc || !this.puedeCargarMas) return;
  this.cargandoMas = true;

  const ref = this.firestore.collection('ordenes_oc', ref => {
    let query = ref.where('estatus', '==', 'Aprobado')
                   .startAfter(this.ultimoDoc)
                   .limit(this.limite);

    return query;
  });

  const snapshot = await ref.get().toPromise();
  if (!snapshot || snapshot.empty) {
    this.puedeCargarMas = false;
    this.cargandoMas = false;
    return;
  }

  const nuevas = snapshot.docs.map(doc => {
    const data = doc.data() as any;
    return {
      id: data.id,
      docId: doc.id,
      estatus: data.estatus,
      responsable: data.responsable,
      centroCosto: data.centroCosto,
      centroCostoNombre: data.centroCostoNombre,
      destinoCompra: data.destinoCompra,
      solpedId: data.solpedId || null,
      fechaFormateada: data.fechaSubida?.toDate?.() ?? null,
      archivoOC: data.archivoOC || null,
      nombreArchivoOC: data.archivoOC?.nombre || null,
      nombrePDF: data.archivosPDF?.nombre || null
    };
  });

  this.ocs = [...this.ocs, ...nuevas];
  this.ocsOriginal = [...this.ocsOriginal, ...nuevas];
  this.ultimoDoc = snapshot.docs[snapshot.docs.length - 1] || null;
  this.puedeCargarMas = snapshot.docs.length === this.limite;
  this.cargandoMas = false;
}



  crearPDFUrl(base64: string): SafeResourceUrl {
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
    const blob = new Blob(byteArrays, { type: 'application/pdf' });
    return this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob));
  }

  async obtenerNombreUsuario(): Promise<string> {
    const user = await this.auth.currentUser;
    const uid = user?.uid;
    if (!uid) return 'Desconocido';

    const userDoc = await this.firestore.collection('Usuarios').doc(uid).get().toPromise();
    const data = userDoc?.data() as { fullName?: string };
    return data?.fullName || 'Desconocido';
  }


onFileSelected(event: any, oc: any) {
  const file: File = event.target.files[0];
  if (!file) return;

  this.archivosSeleccionados[oc.docId] = file;
  this.nombresArchivos[oc.docId] = file.name;

  const fileReader = new FileReader();
  fileReader.onload = () => {
    const url = fileReader.result as string;
    this.vistasPreviasPdf[oc.docId] = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  };
  fileReader.readAsDataURL(file);
}




async eliminarArchivoSeleccionado(oc: any) {
  // Si está en Storage, eliminarlo
  if (oc.archivoOC?.url) {
    try {
      const fileRef = this.storage.refFromURL(oc.archivoOC.url);
      await fileRef.delete().toPromise();

      await this.firestore.collection('ordenes_oc').doc(oc.docId).update({
        archivoOC: firebase.firestore.FieldValue.delete()
      });

    } catch (error) {
      console.warn('No se pudo eliminar el archivo en Storage:', error);
    }
  }

  // ✅ Eliminar archivo local no subido (previamente seleccionado)
  delete this.archivosSeleccionados[oc.docId];
  delete this.nombresArchivos[oc.docId];
  delete this.vistasPreviasPdf[oc.docId];

  this.mostrarToast('Archivo eliminado.', 'warning');
}




async subirPdf(oc: any) {
  const ocId = oc.docId;
  const archivoPDF = this.archivosSeleccionados[ocId];

  if (!archivoPDF) {
    this.mostrarToast('No se ha seleccionado ningún archivo.', 'warning');
    return;
  }

  const fechaSubida = new Date().toISOString();
  const nombreArchivo = archivoPDF.name;
  const rutaStorage = `ordenes_oc/${ocId}/pdf_subido_${Date.now()}_${nombreArchivo}`;
  const fileRef = this.storage.ref(rutaStorage);
  const task = this.storage.upload(rutaStorage, archivoPDF);

  task.snapshotChanges().pipe(
    finalize(async () => {
      const urlDescarga = await fileRef.getDownloadURL().toPromise();

      const nuevoHistorial = [...(oc.historial || []), {
        usuario: await this.obtenerNombreUsuario(),
        estatus: 'PDF Subido',
        fecha: fechaSubida
      }];

      // Guardar en Firestore
      await this.firestore.collection('ordenes_oc').doc(ocId).update({
        archivosPDF: {
          url: urlDescarga,
          nombre: nombreArchivo,
          tipo: archivoPDF.type,
          fechaSubida
        },
        historial: nuevoHistorial,
        pdfSubido: true
      });

      this.mostrarToast('PDF subido correctamente a Storage.', 'success');
      this.cargarOCs();
    })
  ).subscribe();
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

async marcarComoEnviada(oc: any) {
  const ocId = oc.docId;
  const archivoPDF = this.archivosSeleccionados[ocId];

  if (!archivoPDF) {
    this.mostrarToast('Debes seleccionar un archivo para enviar.', 'warning');
    return;
  }

  const filePath = `ordenes_oc/${ocId}/oc_enviada_${Date.now()}_${archivoPDF.name}`;
  const fileRef = this.storage.ref(filePath);
  const uploadTask = this.storage.upload(filePath, archivoPDF);

  uploadTask.snapshotChanges().pipe(
    finalize(async () => {
      try {
        const downloadURL = await fileRef.getDownloadURL().toPromise();
        const fechaActual = new Date();
        const fechaSubida = fechaActual.toISOString();
        const usuarioNombre = await this.obtenerNombreUsuario();

        const nuevoHistorial = [...(oc.historial || []), {
          usuario: usuarioNombre,
          estatus: 'Enviada a proveedor',
          fecha: fechaSubida
        }];

        // ✅ Actualizar OC principal
        await this.firestore.collection('ordenes_oc').doc(ocId).update({
          archivoOC: {
            url: downloadURL,
            nombre: archivoPDF.name,
            tipo: archivoPDF.type,
            fechaSubida
          },
          historial: nuevoHistorial,
          estatus: 'Enviada a proveedor',
          fechaAprobacion: fechaActual,
          aprobadoPor: usuarioNombre
        });

        // ✅ Actualizar en subcolección de la SOLPED
        if (oc.solpedId) {
          const ocDoc = await this.firestore.collection('ordenes_oc').doc(ocId).get().toPromise();
          const ocData: any = ocDoc?.data() || {};

          const dataToSave = {
            archivoOC: {
              url: downloadURL,
              nombre: archivoPDF.name,
              tipo: archivoPDF.type,
              fechaSubida
            },
            archivosStorage: ocData.archivosStorage || [],
            historial: nuevoHistorial,
            estatus: 'Enviada a proveedor',
            docId: ocId,
            id: ocData.id || null, // <-- número de orden
            numero_solped: ocData.numero_solped || null,
            empresa: ocData.empresa || null,
            responsable: ocData.responsable || '',
            centroCosto: ocData.centroCosto || '',
            tipoCompra: ocData.tipoCompra || '',
            precioTotalConIVA: ocData.precioTotalConIVA || 0,
            fechaSubida: ocData.fechaSubida || '',
            fechaAprobacion: fechaActual,
            aprobadoPor: usuarioNombre
          };

          const ocRef = this.firestore.collection('solpes').doc(oc.solpedId).collection('ocs').doc(ocId);
          const snapshot = await ocRef.get().toPromise();

          if (snapshot?.exists) {
            await ocRef.update(dataToSave);
          } else {
            await ocRef.set(dataToSave);
          }

          this.mostrarToast('OC enviada y sincronizada con su SOLPED.', 'success');
        } else {
          this.mostrarToast('OC enviada. No está vinculada a una SOLPED.', 'success');
        }

        this.cargarOCs();

      } catch (error) {
        console.error('❌ Error al enviar OC:', error);
        this.mostrarToast('Error al enviar OC.', 'danger');
      }
    })
  ).subscribe();
}



}
