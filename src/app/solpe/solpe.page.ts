import { Component, OnInit } from '@angular/core';
import {  MenuController, ToastController } from '@ionic/angular';
import { SolpeService } from '../services/solpe.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ViewChildren, QueryList, ElementRef } from '@angular/core';
import imageCompression from 'browser-image-compression';
import { Item } from '../Interface/IItem';
import { Comparaciones } from '../Interface/Icompara';
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
    items: [] as Item[],
    estatus: 'Solicitado',
  };

  constructor(
    private solpeService: SolpeService,
    private toastController: ToastController,
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private menu: MenuController,
  ) {}

  ngOnInit() {
    const hoy = new Date();
    this.solpe.fecha = this.formatDate(hoy);
    this.obtenerUltimoNumeroSolpe();
    this.obtenerNombreUsuario();
  if (!this.solpe.numero_solpe) {
    this.cargarDatosDeLocalStorage();
  }
  }
formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}


cargarDatosDeLocalStorage() {
  const solpeGuardado = localStorage.getItem('solpe');
  if (solpeGuardado) {
    const datos = JSON.parse(solpeGuardado);
    console.log('Datos cargados de localStorage:', datos);

    if (datos.items && datos.items.length > 0) {
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
      this.solpe.items = [];
    }
  } else {
    this.solpe.numero_solpe = 1;
    this.solpe.items = [];
  }
}

guardarDatosEnLocalStorage() {
  if (this.solpe.numero_solpe) {
    if (this.solpe.items && this.solpe.items.length > 0) {
      localStorage.setItem('solpe', JSON.stringify(this.solpe));
    } else {
      this.mostrarToast('No hay ítems para guardar', 'warning');
    }
  }
}




  obtenerUltimoNumeroSolpe() {
    this.solpeService.obtenerUltimaSolpe().subscribe((solpes: any[]) => {
      if (solpes.length > 0) {
        const ultimoNumero = solpes[0].numero_solpe;
        this.solpe.numero_solpe = ultimoNumero + 1;
      } else {
        this.solpe.numero_solpe = 1;
      }
      this.guardarDatosEnLocalStorage();
    });
  }

  ionViewWillEnter() {
    this.menu.enable(false);
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
      imagen_referencia_base64: '',
      editando: true,
    });
  this.guardarDatosEnLocalStorage();
  }


  eliminarItem(index: number) {
    this.solpe.items.splice(index, 1);
    this.guardarDatosEnLocalStorage();
  }

  verificarYGuardarItem(index: number) {
    const item = this.solpe.items[index];
    if (
      item.descripcion &&
      item.codigo_referencial &&
      item.cantidad !== null &&
      item.stock !== null &&
      item.numero_interno && item.numero_interno.trim() !== '' &&
      item.imagen_referencia_base64
    ) {
      this.guardarItem(index);
    }
  }


  subirImagenReferencia(event: any, index: number) {
    const archivo = event.target.files[0];
    if (!archivo || !archivo.type || !archivo.type.startsWith('image/')) {
      this.mostrarToast('Archivo no válido. Solo se permiten imágenes.', 'danger');
      return;
    }

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    };

    imageCompression(archivo, options).then((compressedFile: Blob) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        this.solpe.items[index].imagen_referencia_base64 = base64;
      };
      reader.readAsDataURL(compressedFile);
    }).catch((err) => {
      this.mostrarToast('Error al comprimir la imagen', 'danger');
      console.error(err);
    });
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
    if (!this.solpe.numero_contrato) {
      this.mostrarToast('Debes seleccionar un Centro de Costo', 'warning');
      return;
    }

    if (this.solpe.items.length === 0) {
      this.mostrarToast('Debes agregar al menos un item', 'warning');
      return;
    }

    for (let item of this.solpe.items) {
      if (!item.descripcion || !item.numero_interno || item.numero_interno.trim() === '') {
        this.mostrarToast('Todos los campos excepto Código Referencial son obligatorios', 'warning');
        return;
      }
      if (!item.codigo_referencial || item.codigo_referencial.trim() === '') {
        item.codigo_referencial = '0';
      }
      if (item.cantidad == null || item.cantidad === '') {
        item.cantidad = 0;
      }
      if (item.stock == null || item.stock === '') {
        item.stock = 0;
      }
    }

    const solpeAGuardar = {
      ...this.solpe,
      items: this.solpe.items.map((item: any, index: number) => ({
        item: index + 1,
        descripcion: item.descripcion,
        codigo_referencial: item.codigo_referencial,
        cantidad: item.cantidad,
        stock: item.stock,
        numero_interno: item.numero_interno,
        imagen_referencia_base64: item.imagen_referencia_base64 || null,
      }))
    };

    this.firestore
      .collection('solpes')
      .add(solpeAGuardar)
      .then(async docRef => {
        await this.firestore
          .collection('solpes')
          .doc(docRef.id)
          .collection('historialEstados')
          .add({
            fecha: new Date(),
            estatus: solpeAGuardar.estatus,
            usuario: this.solpe.usuario
          });
        this.mostrarToast('SOLPE guardada con éxito', 'success');
        this.resetearFormulario();
        this.eliminarDatosDeLocalStorage();
      })
      .catch(err => {
        console.error(err);
        this.mostrarToast('Error al guardar la SOLPE', 'danger');
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
    this.solpe = {
      numero_solpe: null,
      numero_contrato: '',
      items: [],
      estatus: 'Solicitado'
    };
    this.obtenerUltimoNumeroSolpe();
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
    this.solpe.items[index].imagen_referencia_base64 = '';  // Elimina la imagen base64
    this.mostrarToast('Imagen eliminada', 'success');
    this.guardarDatosEnLocalStorage();  // Guarda los datos nuevamente después de eliminar la imagen
  }

}
