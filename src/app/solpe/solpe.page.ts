import { Component, OnInit } from '@angular/core';
import {  MenuController, ToastController } from '@ionic/angular';
import { SolpeService } from '../services/solpe.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ViewChildren, QueryList, ElementRef } from '@angular/core';



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
    items: [],
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
    this.solpe.fecha = hoy.toISOString().split('T')[0];
    this.obtenerUltimoNumeroSolpe();
    this.obtenerNombreUsuario();
  }

  obtenerUltimoNumeroSolpe() {
    this.solpeService.obtenerUltimaSolpe().subscribe((solpes: any[]) => {
      if (solpes.length > 0) {
        const ultimoNumero = solpes[0].numero_solpe;
        this.solpe.numero_solpe = ultimoNumero + 1;
      } else {
        this.solpe.numero_solpe = 1;
      }
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
  }




  eliminarItem(index: number) {
    this.solpe.items.splice(index, 1);
    this.mostrarToast('Item eliminado', 'danger');
  }
  verificarYGuardarItem(index: number) {
    const item = this.solpe.items[index];
    if (
      item.descripcion &&
      item.codigo_referencial &&
      item.cantidad !== null &&
      item.stock !== null &&
      item.numero_interno && item.numero_interno.trim() !== ''&&
      item.imagen_referencia_base64
    ) {
      this.guardarItem(index);
    }
  }
  subirImagenReferencia(event: any, index: number) {
    const archivo = event.target.files[0];
    if (archivo && archivo.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        this.solpe.items[index].imagen_referencia_base64 = base64;
        this.mostrarToast('Imagen de referencia guardada', 'success');
      };
      reader.readAsDataURL(archivo);
    } else {
      this.mostrarToast('Solo se permiten archivos de imagen', 'danger');
    }
  }
  seleccionarArchivo(index: number) {
    const input = this.inputsImagenes.toArray()[index];
    input.nativeElement.click();
  }



  guardarItem(index: number) {
    this.solpe.items[index].editando = false;
    this.mostrarToast('Item guardado correctamente', 'success');
  }

  editarItem(index: number) {
    this.solpe.items[index].editando = true;
  }



  guardarEdicion(index: number) {
    this.solpe.items[index].editando = false;
    this.mostrarToast('Item actualizado', 'success');
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

  guardarSolpe() {
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

    const { factura_general, ...restoSolpe } = this.solpe;

    const solpeAGuardar = {
      ...restoSolpe,
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

    this.firestore.collection('solpes').add(solpeAGuardar).then(() => {
      this.mostrarToast('SOLPE guardada con éxito', 'success');
      this.resetearFormulario();
    }).catch(err => {
      console.error(err);
      this.mostrarToast('Error al guardar la SOLPE', 'danger');
    });
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
      fecha: '',
      numero_contrato: '',
      usuario: '',
      items: [],
      estatus: 'Solicitado',
      imagen_referencia_base64: ''
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
}
