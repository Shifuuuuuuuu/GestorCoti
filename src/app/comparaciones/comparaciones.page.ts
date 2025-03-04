import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Comparacion } from '../Interface/IComparacion';
import { ComparacionesService } from '../services/comparaciones.service';
import { AlertController, ModalController } from '@ionic/angular';
import { CotizacionPrecio } from '../Interface/ICotizacionPrecio';
import { ChatModalComponent } from '../chat-modal/chat-modal.component';
import { Insumo } from '../Interface/IInsumo';

@Component({
  selector: 'app-comparaciones',
  templateUrl: './comparaciones.page.html',
  styleUrls: ['./comparaciones.page.scss'],
})
export class ComparacionesPage implements OnInit {
  comparaciones: Comparacion[] = [];
  imagenes: any[] = [];
  seleccionados: { [key: string]: { comparacionId: string; insumo: string; empresa: string; precio: number } } = {};
  segment: string = 'comparaciones';
  imagenesPendientes: any[] = [];
  usuario = {};

  constructor(
    private comparacionesService: ComparacionesService,
    private alertController: AlertController,
    private modalController: ModalController,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarComparaciones();
    this.cargarImagenes();
  }
  esCotizacionConveniente(comparacion: Comparacion): boolean {
    if (!comparacion.cotizacionesPrecios || comparacion.cotizacionesPrecios.length === 0) {
      return false;
    }

    const precios: number[] = comparacion.cotizacionesPrecios.map((cotizacion: CotizacionPrecio) => cotizacion.precio);
    const precioMinimo: number = Math.min(...precios);

    return comparacion.cotizacionesPrecios.some((cotizacion: CotizacionPrecio) => cotizacion.precio === precioMinimo);
  }


  cargarComparaciones() {
    this.comparacionesService.getComparaciones().subscribe(
      data => {
        console.log("Comparaciones recibidas:", data);

        this.comparaciones = data
          .filter(comparacion => comparacion.estado === 'Pendiente') // Solo mostrar las pendientes
          .map(comparacion => ({
            ...comparacion,
            cotizacionesPrecios: comparacion.insumos
              ? comparacion.insumos
                  .map((insumo: Insumo) =>
                    insumo.precios?.map((precio: CotizacionPrecio) => ({
                      empresa: precio.empresa,
                      precio: precio.precio,
                      insumo: insumo.item,
                      descripcion: insumo.descripcion ?? 'Sin descripción',
                      selected: false
                    })) ?? []
                  )
                  .reduce((acc, val) => acc.concat(val), []) // Reemplazo de `flatMap`
              : []
          }));

        console.log("Comparaciones después de procesamiento:", this.comparaciones);
      },
      error => {
        console.error("Error al cargar comparaciones:", error);
      }
    );
  }

    // Método para manejar el trackBy
    trackByCotizacion(index: number, cotizacion: any) {
      return cotizacion.insumo;
    }

    trackByComparacion(index: number, comparacion: any) {
      return comparacion.id;
    }


  cargarImagenes() {
    this.comparacionesService.getImagenes().subscribe(
      data => {
        console.log("Imágenes recibidas:", data);
        this.imagenes = data;
        this.imagenesPendientes = this.imagenes.filter(imagen => imagen.estado === 'Pendiente');
      },
      error => {
        console.error("Error al cargar imágenes:", error);
      }
    );
  }

  getMinPrice(cotizaciones: any[]): number {
    return Math.min(...cotizaciones.map(c => c.precio));
  }


  seleccionarInsumo(comparacionId: string, cotizacion: CotizacionPrecio) {
    // Cambiar el valor de `selected` para esta cotización
    cotizacion.selected = !cotizacion.selected;

    // Verificar si el valor ha cambiado
    console.log("Seleccionado después del cambio:", cotizacion.selected);

    // Buscar la comparación correspondiente
    const comparacion = this.comparaciones.find(c => c.id === comparacionId);
    if (!comparacion) {
      console.error('Comparación no encontrada');
      return;
    }

    // Buscar el insumo dentro de la comparación
    const insumo = comparacion.insumos.find(i => i.item === cotizacion.insumo);
    if (!insumo) {
      console.error('Insumo no encontrado');
      return;
    }

    // Actualizar el campo `selected` en el array de precios del insumo
    insumo.precios.forEach((precio: CotizacionPrecio) => {
      if (precio.insumo === cotizacion.insumo) {
        precio.selected = cotizacion.selected;  // Cambiar el valor de selected solo para este precio
      } else {
        precio.selected = false;  // Desmarcar los demás precios
      }
    });

    console.log("Estado actualizado:", cotizacion);  // Verifica si el valor de selected cambia

    // Actualizar el estado de los seleccionados en la lista de comparaciones
    const key = `${comparacionId}-${cotizacion.insumo}`;
    if (cotizacion.selected) {
      this.seleccionados[key] = {
        comparacionId: comparacionId,
        insumo: cotizacion.insumo,
        empresa: cotizacion.empresa,
        precio: cotizacion.precio,
      };
    } else {
      delete this.seleccionados[key];  // Eliminar el insumo si no está seleccionado
    }

    this.cdr.detectChanges();  // Fuerza la actualización de la vista
  }


  estaSeleccionado(comparacionId: string, insumo: string): boolean {
    return !!this.seleccionados[`${comparacionId}-${insumo}`];
  }

  async aceptarCotizacion(comparacion: Comparacion) {
    console.log("Cotizaciones antes de filtrar:", comparacion.cotizacionesPrecios);  // Verifica los datos antes de filtrar

    // Filtrar solo las cotizaciones seleccionadas
    const seleccionados = comparacion.cotizacionesPrecios.filter(cotizacion => cotizacion.selected);
    console.log("Seleccionados antes de aceptar:", seleccionados);  // Verifica las cotizaciones seleccionadas

    if (seleccionados.length === 0) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Debe seleccionar al menos un insumo antes de aceptar.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    comparacion.estado = 'Aceptada';
    comparacion.cotizacionesPrecios = seleccionados;

    this.comparacionesService.actualizarComparacion(comparacion.id!, {
      estado: 'Aceptada',
      cotizacionesPrecios: seleccionados
    }).then(() => {
      this.cargarComparaciones();  // Recargar las comparaciones
    }).catch(error => console.error('Error al actualizar:', error));
  }



  async rechazarCotizacion(comparacion: Comparacion) {
    comparacion.estado = 'Rechazada';

    this.comparacionesService.actualizarComparacion(comparacion.id!, { estado: 'Rechazada' })
      .then(() => {
        this.cargarComparaciones();
      })
      .catch(error => console.error('Error al actualizar:', error));
  }

  aceptarImagen(id: string | undefined) {
    this.actualizarEstadoImagen(id, 'Aceptada');
  }

  rechazarImagen(id: string | undefined) {
    this.actualizarEstadoImagen(id, 'Rechazada');
  }

  actualizarEstadoImagen(id: string | undefined, estado: 'Aceptada' | 'Rechazada') {
    if (!id) return;

    this.comparacionesService.actualizarEstadoImagen(id, estado).then(() => {
      this.cargarImagenes();
    });
  }

  async openChat(usuario: any) {
    const modal = await this.modalController.create({
      component: ChatModalComponent,
      componentProps: { usuario, receptorId: usuario.uid }
    });
    return await modal.present();
  }
}
