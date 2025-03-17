import { Component, OnInit } from '@angular/core';
import { CotizacionService } from '../services/cotizacion.service';
import { ModalController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-solpe',
  templateUrl: './solpe.page.html',
  styleUrls: ['./solpe.page.scss'],
})
export class SolpePage implements OnInit {
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

  cotizaciones: any[] = []; // Lista de cotizaciones previas
  nuevoInsumo = { nombre: '', cantidad: null, precio: null };

  tipoEntrada: string = 'formulario'; // Determina si el usuario sube imagen o usa el formulario

  constructor(
    private cotizacionesService: CotizacionService,
    private toastController: ToastController,
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

}
