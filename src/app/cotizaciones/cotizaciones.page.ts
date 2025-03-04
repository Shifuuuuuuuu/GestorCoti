import { Component, OnInit } from '@angular/core';
import { CotizacionService } from '../services/cotizacion.service';
import { ToastController } from '@ionic/angular';
import { ChatModalComponent } from '../chat-modal/chat-modal.component';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-cotizaciones',
  templateUrl: './cotizaciones.page.html',
  styleUrls: ['./cotizaciones.page.scss'],
})
export class CotizacionesPage implements OnInit {
  modoSeleccionado: string = 'formulario';
  cotizacion: any = {
    nombre: '',
    codigo: '',
    solicitante: '',
    obra: '',
    numero_correlativo: '',
    fecha: '',
    prioridad: '',
    nombre_local: '',
    numero_contrato: '',
    insumos: [],
    estado: 'Pendiente',
  };
  usuario = {};
  imagen = {
    nombre: '',  // Esta propiedad guardará el nombre personalizado de la imagen
    imagenUrl: '',
    tipo: 'cotizacion'  // Agregamos el tipo por defecto
  };

  cotizaciones: any[] = []; // Lista de cotizaciones previas
  nuevoInsumo = { nombre: '', cantidad: null, precio: null };

  tipoEntrada: string = 'formulario'; // Determina si el usuario sube imagen o usa el formulario
  imagenBase64: string | null = null; // Guarda la imagen en Base64

  constructor(
    private cotizacionesService: CotizacionService,
    private toastController: ToastController,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.cargarCotizacionesPrevias();
  }

  agregarInsumo() {
    if (!this.nuevoInsumo.nombre || !this.nuevoInsumo.cantidad || !this.nuevoInsumo.precio) {
      this.mostrarToast('Todos los campos del insumo son obligatorios', 'warning');
      return;
    }

    this.cotizacion.insumos.push({ ...this.nuevoInsumo });
    this.nuevoInsumo = { nombre: '', cantidad: null, precio: null };
    this.mostrarToast('Insumo agregado con éxito', 'success');
  }

  eliminarInsumo(index: number) {
    this.cotizacion.insumos.splice(index, 1);
    this.mostrarToast('Insumo eliminado', 'warning');
  }

  enviarCotizacion() {
    if (this.cotizacion.insumos.length === 0) {
      this.mostrarToast('Debes agregar al menos un insumo antes de enviar', 'warning');
      return;
    }

    this.cotizacion.estado = 'Pendiente';
    this.cotizacionesService.guardarCotizacion(this.cotizacion)
      .then(() => {
        this.mostrarToast('Cotización enviada con éxito', 'success');
        this.resetearFormulario();
      })
      .catch((error) => {
        console.error('Error al enviar la cotización:', error);
        this.mostrarToast('Error al enviar la cotización', 'danger');
      });
  }

  subirImagen(event: any) {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagenBase64 = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  guardarImagen() {
    // Validar si el nombre y la imagen están presentes
    if (!this.imagenBase64 || !this.imagen.nombre) {
      this.mostrarToast('Selecciona una imagen y asigna un nombre primero', 'warning');
      return;
    }

    const imagenData = {
      imagenUrl: this.imagenBase64,   // Guardamos la imagen en base64
      nombre: this.imagen.nombre,     // Guardamos el nombre personalizado de la imagen
      fecha: new Date().toISOString(),
      estado: 'Pendiente',             // Estado por defecto
      tipo: this.imagen.tipo          // Guardamos el tipo de la imagen
    };

    // Llamamos al servicio para guardar la imagen
    this.cotizacionesService.guardarImagenCotizacion(imagenData)
      .then(() => {
        this.mostrarToast('Imagen guardada correctamente', 'success');
        this.resetearImagen();  // Limpiar los datos de la imagen
      })
      .catch((error) => {
        console.error('Error al guardar la imagen:', error);
        this.mostrarToast('Error al guardar la imagen', 'danger');
      });
  }

  resetearImagen() {
    this.imagenBase64 = '';  // Limpiar la URL base64 de la imagen
    this.imagen.nombre = '';  // Limpiar el nombre de la imagen
  }

  cargarCotizacionesPrevias() {
    this.cotizacionesService.obtenerCotizaciones()
      .then((data) => {
        this.cotizaciones = data;
      })
      .catch((error) => {
        console.error('Error al obtener cotizaciones:', error);
      });
  }

  // Guardar como borrador
  guardarBorrador() {
    const borrador = { ...this.cotizacion, estado: 'Borrador' };
    this.cotizacionesService.guardarCotizacion(borrador)
      .then(() => {
        this.mostrarToast('Borrador guardado con éxito', 'success');
      })
      .catch((error) => {
        console.error('Error al guardar borrador:', error);
        this.mostrarToast('Error al guardar borrador', 'danger');
      });
  }

  // Cargar borrador
  cargarBorrador() {
    const borrador = this.cotizaciones.find(cot => cot.estado === 'Borrador');
    if (borrador) {
      this.cotizacion = { ...borrador };
    } else {
      this.mostrarToast('No hay borradores disponibles', 'warning');
    }
  }

  resetearFormulario() {
    this.cotizacion = {
      nombre: '',
      codigo: '',
      solicitante: '',
      obra: '',
      numero_correlativo: '',
      fecha: '',
      prioridad: '',
      nombre_local: '',
      numero_contrato: '',
      insumos: [],
      estado: 'Pendiente',
    };
    this.nuevoInsumo = { nombre: '', cantidad: null, precio: null };
  }

  // Función para mostrar Toast con diferentes colores según el tipo de mensaje
  async mostrarToast(mensaje: string, tipo: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      position: 'bottom',
      color: tipo,  // Cambiar color según el tipo de mensaje
      cssClass: 'custom-toast'  // Clase CSS para personalizar el estilo
    });
    toast.present();
  }

  async openChat(usuario: any) {
    const modal = await this.modalController.create({
      component: ChatModalComponent,
      componentProps: { usuario, receptorId: usuario.uid }
    });
    return await modal.present();
  }
}
