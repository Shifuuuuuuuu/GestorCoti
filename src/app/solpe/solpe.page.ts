import { Component, OnInit } from '@angular/core';
import {  MenuController, ToastController } from '@ionic/angular';
import { SolpeService } from '../services/solpe.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ViewChildren, QueryList, ElementRef } from '@angular/core';
import imageCompression from 'browser-image-compression';
import { Item } from '../Interface/IItem';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
@Component({
  selector: 'app-solpe',
  templateUrl: './solpe.page.html',
  styleUrls: ['./solpe.page.scss'],
})
export class SolpePage implements OnInit  {
  @ViewChildren('inputImagenRef') inputsImagenes!: QueryList<ElementRef>;
  modoSeleccionado: string = 'formulario';
  solpe: any = {
    numero_solpe: null,
    fecha: '',
    numero_contrato: '',
    usuario: '',
    nombre_solped: '',
    tipo_solped: '',
    empresa: '',
    items: [] as Item[],
    estatus: 'Solicitado',
    dirigidoA: '', // 🆕 Campo nuevo
  };
  enviandoSolpe = false;
  usuariosDisponibles: string[] = [
  'Daniela Lizama',
  'Luis Orellana',
  'Guillermo Manzor',
  'María José Ballesteros'
];


centrosCosto: { [key: string]: string } = {
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
    private solpeService: SolpeService,
    private toastController: ToastController,
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private menu: MenuController,
    private storage: AngularFireStorage,
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

  const numero = await this.obtenerUltimoNumeroSolpePorEmpresa(empresaSeleccionada);
  this.solpe.numero_solpe = numero;
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
    this.mostrarToast('Debes agregar al menos un item', 'warning');
    return;
  }
  if (!this.solpe.nombre_solped || this.solpe.nombre_solped.trim() === '') {
  this.mostrarToast('Debes ingresar el nombre de la SOLPED', 'warning');
  return;
  }

  if (!this.solpe.dirigidoA || this.solpe.dirigidoA.trim() === '') {
    this.mostrarToast('Debes seleccionar a quién va dirigida la SOLPED', 'warning');
    return;
  }

  for (let item of this.solpe.items) {
    if (!item.descripcion || !item.numero_interno || !this.solpe.empresa || item.numero_interno.trim() === '' ) {
      this.mostrarToast('Todos los campos excepto Código Referencial son obligatorios', 'warning');
      return;
    }
    item.codigo_referencial = item.codigo_referencial?.trim() || 'SIN CÓDIGO';
    item.cantidad = item.cantidad || 0;
    item.stock = item.stock || 0;
  }

  try {
    // ✅ Obtener número SOLPED único y actualizado
    const numeroSolpeAsignado = await this.obtenerUltimoNumeroSolpePorEmpresa(this.solpe.empresa);
    this.solpe.numero_solpe = numeroSolpeAsignado;

    // Actualizar fecha y nombre
    this.solpe.fecha = this.formatDate(new Date());
    this.solpe.nombre_solped = this.solpe.nombre_solped?.toUpperCase() || '';

    const solpeAGuardar = {
      numero_solpe: numeroSolpeAsignado,
      fecha: this.solpe.fecha,
      numero_contrato: this.solpe.numero_contrato,
      nombre_centro_costo: this.solpe.nombre_centro_costo || this.centrosCosto[this.solpe.numero_contrato] || '',
      usuario: this.solpe.usuario,
      dirigidoA: this.solpe.dirigidoA,
      nombre_solped: this.solpe.nombre_solped,
      tipo_solped: this.solpe.tipo_solped,
      empresa: this.solpe.empresa,
      estatus: this.solpe.estatus,
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
eliminarImagen(index: number) {
  this.solpe.items[index].imagen_url = '';
  this.mostrarToast('Imagen eliminada', 'success');
  this.guardarDatosEnLocalStorage();
}


}
