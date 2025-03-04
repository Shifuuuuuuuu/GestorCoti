import { Component, OnInit } from '@angular/core';
import { CotizacionComparativaService } from '../services/cotizacion-comparativa.service';
import { Insumo } from '../Interface/IInsumo';
import { CotizacionPrecio } from '../Interface/ICotizacionPrecio';
import { ModalController, ToastController } from '@ionic/angular';
import { ChatModalComponent } from '../chat-modal/chat-modal.component';

@Component({
  selector: 'app-cotizacion-comparativa',
  templateUrl: './cotizacion-comparativa.page.html',
  styleUrls: ['./cotizacion-comparativa.page.scss'],
})
export class CotizacionComparativaPage implements OnInit {
  modoSeleccionado: string = 'formulario';  // Variable para controlar el segmento activo
  cotizacion: any = {
    nombre: '',
    codigo: '',
    solicitante: '',
    obra: '',
    prioridad: 'Normal',
    insumos: [],
    estado: 'Pendiente',
    fechaSolicitud: ''  // Nueva propiedad para la fecha de solicitud
  };


  nuevoInsumo: any = {
    item: '',
    unidad: '',
    descripcion: '',
    solicitud: ''
  };

  cotizacionesPrecios: any[] = []; // Lista de cotizaciones de precios
  usuario = {};
  nuevaCotizacion: any = {
    insumo: '',
    empresa: '',
    precio: 0
  };

  imagen = {
    nombre: '',
    imagenUrl: '',
    tipo: 'comparativa'  // Agregamos el campo tipo para almacenar el tipo de imagen
  };

  imagenBase64: string | null = null; // Para la imagen cargada

  constructor(private cotizacionesService: CotizacionComparativaService,
    private modalController: ModalController,
    private toastController: ToastController) { }

  ngOnInit() {
    this.cargarCotizacionesPrevias();  // Cargar cotizaciones previas al iniciar
  }


  // Función para guardar borrador
  guardarBorrador() {
    const cotizacionBorrador = { ...this.cotizacion, estado: 'Borrador' };
    this.cotizacionesService.guardarCotizacionComparativa(cotizacionBorrador)
      .then(() => {
        this.mostrarToast('Borrador guardado con éxito', 'success');
      })
      .catch((error) => {
        console.error('Error al guardar borrador:', error);
        this.mostrarToast('Error al guardar borrador', 'danger');
      });
  }
  subirImagen(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.imagenBase64 = reader.result as string;
      this.cotizacion.estado = 'Pendiente';

      // Asignamos el tipo de imagen como 'comparativa' de forma fija
      this.imagen.tipo = 'comparativa';  // Establecemos el tipo de imagen como 'comparativa'

      // Asignamos la fecha actual a la propiedad fechaSolicitud
      this.cotizacion.fechaSolicitud = new Date().toISOString(); // La fecha actual en formato ISO
    };
    reader.readAsDataURL(file);
  }

  async guardarImagen() {
    if (this.imagenBase64 && this.imagen.nombre && this.imagen.tipo) {
      try {
        const imagenData = {
          base64: this.imagenBase64,
          nombre: this.imagen.nombre,
          tipo: this.imagen.tipo  // Usamos 'comparativa' como tipo fijo
        };

        // Llamamos al servicio para guardar la imagen de tipo 'comparativa'
        await this.cotizacionesService.guardarImagenComparativa(imagenData);

        const toast = await this.toastController.create({
          message: 'Imagen guardada con éxito',
          duration: 2000,
          position: 'bottom',
          color: 'success'
        });
        toast.present();

        // Limpiar los datos de la imagen después de guardar
        this.imagenBase64 = null;
        this.imagen.nombre = '';
        this.imagen.tipo = '';  // Limpiamos el tipo también
      } catch (error) {
        console.error('Error al guardar la imagen:', error);
        const toast = await this.toastController.create({
          message: 'Hubo un error al guardar la imagen',
          duration: 2000,
          position: 'bottom',
          color: 'danger'
        });
        toast.present();
      }
    } else {
      const toast = await this.toastController.create({
        message: 'Por favor, completa todos los campos antes de guardar.',
        duration: 2000,
        position: 'bottom',
        color: 'warning'
      });
      toast.present();
    }
  }


  // Función para cargar borrador
  cargarBorrador() {
    const borrador = this.cotizacionesPrecios.find(cot => cot.estado === 'Borrador');
    if (borrador) {
      this.cotizacion = { ...borrador };
      this.mostrarToast('Borrador cargado con éxito', 'success');
    } else {
      this.mostrarToast('No hay borradores disponibles', 'warning');
    }
  }

  // Cargar cotizaciones previas para buscar el borrador
  cargarCotizacionesPrevias() {
    this.cotizacionesService.obtenerCotizacionesComparativas()
      .then((data) => {
        this.cotizacionesPrecios = data;
      })
      .catch((error) => {
        console.error('Error al obtener cotizaciones:', error);
      });
  }

  // Función para agregar insumos
  agregarInsumo() {
    if (!this.nuevoInsumo.item || !this.nuevoInsumo.unidad || !this.nuevoInsumo.descripcion || !this.nuevoInsumo.solicitud) {
      alert('Por favor, completa todos los campos del insumo');
      return;
    }

    const insumoExistente = this.cotizacion.insumos.find((insumo: any) => insumo.item === this.nuevoInsumo.item);

    if (insumoExistente) {
      alert('Este insumo ya ha sido agregado.');
    } else {
      this.cotizacion.insumos.push({
        item: this.nuevoInsumo.item,
        unidad: this.nuevoInsumo.unidad,
        descripcion: this.nuevoInsumo.descripcion,
        solicitud: this.nuevoInsumo.solicitud,
        precios: []
      });
    }

    this.nuevoInsumo = { item: '', unidad: '', descripcion: '', solicitud: '' };
  }

  // Función para agregar precios a un insumo específico
  agregarCotizacionPrecio() {
    const insumoEncontrado = this.cotizacion.insumos.find((insumo: any) => insumo.item === this.nuevaCotizacion.insumo);

    if (!insumoEncontrado) {
      alert('El insumo especificado no existe en la lista.');
      return;
    }

    if (!this.nuevaCotizacion.empresa || this.nuevaCotizacion.precio <= 0) {
      alert('Por favor, completa los datos de la cotización correctamente.');
      return;
    }

    if (!insumoEncontrado.precios) {
      insumoEncontrado.precios = [];
    }

    const nuevaCotizacionPrecio = {
      empresa: this.nuevaCotizacion.empresa,
      precio: this.nuevaCotizacion.precio,
      selected: false,
      insumo: this.nuevaCotizacion.insumo,
    };

    insumoEncontrado.precios.push(nuevaCotizacionPrecio);
    this.nuevaCotizacion = { insumo: '', empresa: '', precio: 0 };
    console.log('Cotización agregada:', this.cotizacion.insumos);
  }

  obtenerMenorPrecio(insumo: string): number {
    const preciosInsumo: any[] = this.cotizacion.insumos
      .find((i: any) => i.item === insumo)?.precios || [];

    return preciosInsumo.length > 0
      ? Math.min(...preciosInsumo.map((cot: any) => cot.precio))
      : -1;
  }

  async enviarCotizacion() {
    if (this.cotizacion.insumos.length === 0) {
      const toast = await this.toastController.create({
        message: 'Debe agregar al menos un insumo.',
        duration: 2000,
        position: 'bottom',
        color: 'warning'
      });
      toast.present();
      return;
    }

    this.cotizacion.estado = 'Pendiente';

    try {
      await this.cotizacionesService.guardarComparacion(this.cotizacion);

      const toast = await this.toastController.create({
        message: 'Cotización enviada con éxito',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      toast.present();

      this.resetearFormulario();
    } catch (error) {
      console.error('Error al enviar la cotización:', error);
      const toast = await this.toastController.create({
        message: 'Error al enviar la cotización',
        duration: 2000,
        position: 'bottom',
        color: 'danger'
      });
      toast.present();
    }
  }

  resetearFormulario() {
    this.cotizacion = {
      nombre: '',
      codigo: '',
      solicitante: '',
      obra: '',
      prioridad: 'Normal',
      insumos: [],
      estado: 'Pendiente',
      fechaSolicitud: ''
    };
  }

  // Función para mostrar el Toast
  async mostrarToast(mensaje: string, tipo: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      position: 'bottom',
      color: tipo
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

  eliminarInsumo(index: number) {
    this.cotizacion.insumos.splice(index, 1);
  }

  eliminarCotizacion(insumo: any, precio: any) {
    insumo.precios = insumo.precios.filter((p: any) => p !== precio);
  }
}

