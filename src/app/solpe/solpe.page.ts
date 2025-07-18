import { Component, OnInit } from '@angular/core';
import {  MenuController, ToastController } from '@ionic/angular';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ViewChildren, QueryList, ElementRef, ViewChild } from '@angular/core';
import imageCompression from 'browser-image-compression';
import { Item } from '../Interface/IItem';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-solpe',
  templateUrl: './solpe.page.html',
  styleUrls: ['./solpe.page.scss'],
})
export class SolpePage implements OnInit  {
  @ViewChildren('inputAutorizacion') inputAutorizacion!: QueryList<ElementRef>;
  @ViewChildren('inputImagenRef') inputsImagenes!: QueryList<ElementRef>;
  @ViewChild('inputAutorizacionRef') inputAutorizacionRef!: ElementRef;

  modoSeleccionado: string = 'formulario';
  solpe: any = {
    autorizacion_url: null,
    autorizacion_nombre: null,
    numero_solpe: null,
    fecha: '',
    numero_contrato: '',
    usuario: '',
    nombre_solped: '',
    tipo_solped: '',
    empresa: '',
    items: [] as Item[],
    estatus: 'Solicitado',
    dirigidoA: [] as string[],
  };
  requiereAutorizacion: boolean = false;
  enviandoSolpe = false;
  usuariosDisponibles: string[] = [
  'Daniela Lizama',
  'Luis Orellana',
  'Guillermo Manzor',
  'María José Ballesteros'
  ];
  loadingEmpresa: boolean = false;


centrosCosto: { [key: string]: string } = {
  '22368': 'CONTRATO SUMINISTRO DE HORMIGONES DET',
  '20915': 'CONTRATO SUMINISTRO DE HORMIGONES DAND',
  '23302': 'CONTRATO MANTENCIÓN Y REPARACIÓN DE INFRAESTRUCTURA DAND',
  '28662': 'CONTRATO REPARACIÓN DE CARPETAS DE RODADO DET',
  'SANJOAQUIN': 'SERVICIO PLANTA DE ÁRIDOS SAN JOAQUÍN',
  'URBANOS': 'SUMINISTRO DE HORMIGONES URBANOS SAN BERNARDO Y OLIVAR',
  'CS': 'CONTRATO DE SUMINISTRO DE HORMIGONES CS',
  'PREDOSIFICADO': 'CONTRATO HORMIGONES Y PREDOSIFICADO',
  'CANECHE': 'CONTRATO TALLER CANECHE',
  'CASAMATRIZ': 'CONTRATO CASA MATRIZ',
  'ALTOMAIPO': 'CONTRATO ALTO MAIPO',
  'INFRAESTRUCTURA': 'CONTRATO INFRAESTRUCTURA DET',
  'CHUQUICAMATA': 'CONTRATO CHUQUICAMATA',
  'CARPETASDET':'CONTRATO CARPETAS DET',
};



  constructor(
    private toastController: ToastController,
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private menu: MenuController,
    private storage: AngularFireStorage,
    private loadingCtrl: LoadingController
  ) {}

async ngOnInit() {
  const hoy = new Date();
  this.solpe.fecha = this.formatDate(hoy);
  this.obtenerNombreUsuario();

  const solpeGuardado = localStorage.getItem('solpe');

  if (solpeGuardado) {
    this.cargarDatosDeLocalStorage();
  } else {
    this.solpe.fecha = this.formatDate(hoy);
    this.solpe.items = [];
    if (this.solpe.empresa) {
      const numero = await this.obtenerUltimoNumeroSolpePorEmpresa(this.solpe.empresa);
      this.solpe.numero_solpe = numero;
    }
  }
}

formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
actualizarCentroCosto(event: any) {
  const codigoSeleccionado = event.detail.value;
  console.log('Centro de costo seleccionado:', codigoSeleccionado); // 🔍
  this.solpe.numero_contrato = codigoSeleccionado;
  this.solpe.nombre_centro_costo = this.centrosCosto[codigoSeleccionado] || '';
}
seleccionarArchivoAutorizacion() {
  if (this.inputAutorizacionRef && this.inputAutorizacionRef.nativeElement) {
    this.inputAutorizacionRef.nativeElement.click();
  } else {
    console.warn('inputAutorizacionRef no está listo aún.');
  }
}


async subirArchivoAutorizacion(event: any) {
  const archivo: File = event.target.files[0];
  if (!archivo) return;

  const nombreArchivo = `autorizacion_${this.solpe.numero_solpe || 'temp'}_${Date.now()}_${archivo.name}`;
  const ruta = `solped_autorizaciones/${nombreArchivo}`;
  const ref = this.storage.ref(ruta);
  const task = this.storage.upload(ruta, archivo);

  const loading = await this.loadingCtrl.create({
    message: 'Subiendo autorización...',
    spinner: 'bubbles',
    backdropDismiss: false
  });
  await loading.present();

  task.snapshotChanges().pipe(
    finalize(async () => {
      const url = await ref.getDownloadURL().toPromise();
      this.solpe.autorizacion_url = url;
      this.solpe.autorizacion_nombre = archivo.name;
      await loading.dismiss();
      this.mostrarToast('Archivo subido correctamente', 'success');
    })
  ).subscribe();
}
async eliminarArchivoAutorizacion() {
  if (!this.solpe.autorizacion_url) return;

  const confirmar = confirm('¿Estás seguro que deseas eliminar el archivo de autorización?');
  if (!confirmar) return;

  try {
    const storageRef = firebase.storage().refFromURL(this.solpe.autorizacion_url);
    await storageRef.delete();

    this.solpe.autorizacion_url = null;
    this.solpe.autorizacion_nombre = null;

    this.mostrarToast('Archivo de autorización eliminado', 'success');
  } catch (error) {
    console.error('Error al eliminar archivo de Storage:', error);
    this.mostrarToast('Error al eliminar el archivo', 'danger');
  }
}

cargarDatosDeLocalStorage() {
  const solpeGuardado = localStorage.getItem('solpe');
  const hoy = this.formatDate(new Date());

  if (solpeGuardado) {
    const datos = JSON.parse(solpeGuardado);
    console.log('Datos cargados de localStorage:', datos);

    if (datos.fecha !== hoy) {
      datos.fecha = hoy;
      datos.items = [];
    }

    this.solpe = { ...datos };
    this.solpe.items = this.solpe.items.map((item: Item) => ({
      ...item,
      descripcion: item.descripcion || '',
      codigo_referencial: item.codigo_referencial || '',
      cantidad: item.cantidad || 0,
      stock: item.stock || 0,
      numero_interno: item.numero_interno || '',
      imagen_referencia_base64: item.imagen_referencia_base64 || '',
      comparaciones: item.comparaciones || [],
    }));
  } else {
    this.solpe.numero_solpe = 1;
    this.solpe.fecha = hoy;
    this.solpe.items = [];
  }
}



guardarDatosEnLocalStorage() {
  if (this.solpe.numero_solpe && this.solpe.items.length > 0) {
    localStorage.setItem('solpes', JSON.stringify(this.solpe)); // NO "solpes"
  } else {
    this.eliminarDatosDeLocalStorage();
  }
}



guardarSolpeEnLocalStorage() {
  localStorage.setItem('solpe', JSON.stringify(this.solpe));
}



async obtenerUltimoNumeroSolpePorEmpresa(empresa: string): Promise<number> {
  if (!empresa) {
    console.error('❌ Empresa no definida');
    throw new Error('Empresa no definida');
  }

  try {
    const snapshot = await this.firestore.collection('solpes', ref =>
      ref.where('empresa', '==', empresa)
    ).get().toPromise() as firebase.firestore.QuerySnapshot<any>;

    if (snapshot.empty) {
      return 1;
    }

    let max = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const numero = Number(data.numero_solpe);

      if (!isNaN(numero) && numero > max) {
        max = numero;
      }
    });

    const siguienteNumero = max + 1;
    return siguienteNumero;

  } catch (error: any) {
    throw error;
  }
}


async actualizarEmpresa(event: any) {
  const empresaSeleccionada = event.detail.value;
  this.solpe.empresa = empresaSeleccionada;

  // Mostrar el loader
  const loading = await this.loadingCtrl.create({
    message: 'Cargando número de SOLPED...',
    spinner: 'crescent',
    backdropDismiss: false,
  });
  await loading.present();

  try {
    // Espera artificial para mostrar el loading (opcional)
    await new Promise(resolve => setTimeout(resolve, 300));

    const numero = await this.obtenerUltimoNumeroSolpePorEmpresa(empresaSeleccionada);
    this.solpe.numero_solpe = numero;
  } catch (error) {
    this.mostrarToast('Error al obtener número de SOLPED', 'danger');
  } finally {
    // Ocultar el loader
    await loading.dismiss();
  }
}





  ionViewWillEnter() {
    this.menu.enable(true);
  }

agregarFila() {
  const nuevoId = this.solpe.items.length > 0 ? this.solpe.items[this.solpe.items.length - 1].id + 1 : 1;
  this.solpe.items.push({
    id: nuevoId,
    descripcion: '',
    codigo_referencial: '',
    cantidad: null,
    stock: null,
    numero_interno: '',
    imagen_url: '',  // ✅ ahora usamos URL en lugar de base64
    editando: true,
  });
  this.guardarDatosEnLocalStorage();
}


eliminarItem(index: number) {
  if (index >= 0 && index < this.solpe.items.length) {
    this.solpe.items.splice(index, 1);

    if (this.solpe.items.length > 0) {
      this.guardarDatosEnLocalStorage();
    } else {
      this.eliminarDatosDeLocalStorage();
    }
  }
}



verificarYGuardarItem(index: number) {
  const item = this.solpe.items[index];
  if (
    item.descripcion &&
    item.codigo_referencial &&
    item.cantidad !== null &&
    item.stock !== null &&
    item.numero_interno &&
    item.numero_interno.trim() !== '' &&
    item.imagen_referencia_base64
  ) {
    this.guardarDatosEnLocalStorage();
  }
}



async subirImagenReferencia(event: any, index: number) {
  const archivo = event.target.files[0];
  if (!archivo || !archivo.type.startsWith('image/')) {
    this.mostrarToast('Archivo no válido. Solo se permiten imágenes.', 'danger');
    return;
  }

  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 800,
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(archivo, options);
    const nombreArchivo = `solped_${this.solpe.numero_solpe || 'temp'}_${index}_${Date.now()}.jpg`;
    const ruta = `solped_images/${nombreArchivo}`;
    const ref = this.storage.ref(ruta);
    const task = this.storage.upload(ruta, compressedFile);

    task.snapshotChanges().pipe(
      finalize(async () => {
        const url = await ref.getDownloadURL().toPromise();
        this.solpe.items[index].imagen_url = url;
        this.mostrarToast('Imagen subida correctamente', 'success');
        this.guardarDatosEnLocalStorage();
      })
    ).subscribe();

  } catch (err) {
    console.error(err);
    this.mostrarToast('Error al subir la imagen', 'danger');
  }
}


  seleccionarArchivo(index: number) {
    const inputs = this.inputsImagenes.toArray();
    if (inputs[index]) {
      inputs[index].nativeElement.click();
    } else {
      console.warn('Input de imagen no disponible');
    }
  }

guardarItem(index: number) {
  this.solpe.items[index].editando = false;
  this.guardarDatosEnLocalStorage();
}


editarItem(index: number) {
  this.solpe.items[index].editando = true;
}

  guardarEdicion(index: number) {
    this.solpe.items[index].editando = false;
  }

  obtenerNombreUsuario() {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        const uid = user.uid;
        this.firestore.collection('Usuarios').doc(uid).get().subscribe(doc => {
          if (doc.exists) {
            const data: any = doc.data();
            this.solpe.usuario = data.fullName;
          } else {
            console.log('No se encontró el usuario en la colección.');
          }
        });
      } else {
        console.log('No hay usuario logueado');
      }
    });
  }

async guardarSolpe() {
  if (this.enviandoSolpe) {
    this.mostrarToast('Espera antes de enviar otra SOLPED', 'warning');
    return;
  }

  this.enviandoSolpe = true;
  setTimeout(() => {
    this.enviandoSolpe = false;
  }, 5000);

  if (!this.solpe.numero_contrato) {
    this.mostrarToast('Debes seleccionar un Centro de Costo', 'warning');
    return;
  }

  if (this.solpe.items.length === 0) {
    this.mostrarToast('Debes agregar al menos un ítem', 'warning');
    return;
  }

  if (!this.solpe.nombre_solped || this.solpe.nombre_solped.trim() === '') {
    this.mostrarToast('Debes ingresar el nombre de la SOLPED', 'warning');
    return;
  }

  if (!this.solpe.dirigidoA || this.solpe.dirigidoA.length === 0) {
    this.mostrarToast('Debes seleccionar al menos un cotizador para la SOLPED', 'warning');
    return;
  }

  for (let item of this.solpe.items) {
    if (!item.descripcion || !item.numero_interno || !this.solpe.empresa || item.numero_interno.trim() === '') {
      this.mostrarToast('Todos los campos excepto Código Referencial son obligatorios', 'warning');
      return;
    }

    item.codigo_referencial = item.codigo_referencial?.trim() || 'SIN CÓDIGO';
    item.cantidad = item.cantidad || 0;
    item.stock = item.stock || 0;
  }

  try {
    const numeroSolpeAsignado = await this.obtenerUltimoNumeroSolpePorEmpresa(this.solpe.empresa);
    this.solpe.numero_solpe = numeroSolpeAsignado;
    this.solpe.fecha = this.formatDate(new Date());
    this.solpe.nombre_solped = this.solpe.nombre_solped?.toUpperCase() || '';

    const solpeAGuardar = {
      numero_solpe: numeroSolpeAsignado,
      fecha: this.solpe.fecha,
      numero_contrato: this.solpe.numero_contrato,
      nombre_centro_costo: this.solpe.nombre_centro_costo || this.centrosCosto[this.solpe.numero_contrato] || '',
      usuario: this.solpe.usuario,
      dirigidoA: this.solpe.dirigidoA, // ✅ array de cotizadores
      nombre_solped: this.solpe.nombre_solped,
      tipo_solped: this.solpe.tipo_solped,
      empresa: this.solpe.empresa,
      estatus: this.solpe.estatus,
      autorizacion_url: this.solpe.autorizacion_url || null,
      autorizacion_nombre: this.solpe.autorizacion_nombre || null,
      items: this.solpe.items.map((item: any, index: number) => ({
        item: index + 1,
        descripcion: item.descripcion,
        codigo_referencial: item.codigo_referencial,
        cantidad: item.cantidad,
        stock: item.stock,
        numero_interno: item.numero_interno,
        imagen_url: item.imagen_url || null,
        estado: 'pendiente'
      }))
    };

    const docRef = await this.firestore.collection('solpes').add(solpeAGuardar);

    await this.firestore.collection('solpes').doc(docRef.id).collection('historialEstados').add({
      fecha: new Date(),
      estatus: this.solpe.estatus,
      usuario: this.solpe.usuario
    });

    this.mostrarToast('SOLPED guardada con éxito', 'success');
    this.resetearFormulario();
    this.eliminarDatosDeLocalStorage();

  } catch (err) {
    console.error(err);
    this.mostrarToast('Error al guardar la SOLPED', 'danger');
  }
}


async obtenerYAsignarNumeroSolpe(empresa: string): Promise<number> {
  const counterRef = this.firestore.collection('counters').doc(`solpe_${empresa}`);

  return this.firestore.firestore.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef.ref);
    let nuevoNumero = 1;

    if (doc.exists) {
      const data = doc.data() as { ultimoNumero: number };
      nuevoNumero = (data?.ultimoNumero || 0) + 1;
    }

    transaction.set(counterRef.ref, { ultimoNumero: nuevoNumero }, { merge: true });

    return nuevoNumero;
  });
}




eliminarDatosDeLocalStorage() {
  localStorage.removeItem('solpes');
}

  convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

resetearFormulario() {
  const hoy = this.formatDate(new Date());
  const empresaActual = this.solpe.empresa;

  this.solpe = {
    numero_solpe: null,
    fecha: hoy,
    numero_contrato: '',
    usuario: this.solpe.usuario,
    nombre_solped: '',
    tipo_solped: '',
    empresa: empresaActual,
    items: [],
    estatus: 'Solicitado',
  };

  if (empresaActual) {
    this.obtenerUltimoNumeroSolpePorEmpresa(empresaActual);
  }
}





  async mostrarToast(mensaje: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      color: color
    });
    toast.present();
  }
async eliminarImagen(index: number) {
  const imagenUrl = this.solpe.items[index].imagen_url;

  if (!imagenUrl) {
    this.mostrarToast('No hay imagen para eliminar', 'warning');
    return;
  }

  const confirmar = confirm('¿Estás seguro de que deseas eliminar esta imagen?');
  if (!confirmar) return;

  try {
    // Obtener referencia desde la URL y eliminarla del Cloud Storage
    const storageRef = firebase.storage().refFromURL(imagenUrl);
    await storageRef.delete();

    // Eliminar la URL localmente
    this.solpe.items[index].imagen_url = '';
    this.guardarDatosEnLocalStorage();

    this.mostrarToast('Imagen eliminada correctamente', 'success');
  } catch (error) {
    console.error('Error al eliminar la imagen del Storage:', error);
    this.mostrarToast('Error al eliminar la imagen del Storage', 'danger');
  }
}



}
