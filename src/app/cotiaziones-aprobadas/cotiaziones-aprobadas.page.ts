import { Component, OnInit } from '@angular/core';
import { CotizacionComparativaService } from '../services/cotizacion-comparativa.service';
import { Cotizacion } from '../Interface/ICotizacion';
import { Comparacion } from '../Interface/IComparacion';
import { CotizacionPrecio } from '../Interface/ICotizacionPrecio';
import { VistaCotizacionesService } from '../services/vista-cotizaciones.service';
import { ChatModalComponent } from '../chat-modal/chat-modal.component';
import { ModalController } from '@ionic/angular';
import { Imagen } from '../Interface/IImagen';

@Component({
  selector: 'app-cotiaziones-aprobadas',
  templateUrl: './cotiaziones-aprobadas.page.html',
  styleUrls: ['./cotiaziones-aprobadas.page.scss'],
})
export class CotiazionesAprobadasPage implements OnInit {
  cotizacionesAprobadas: Cotizacion[] = [];
  comparacionesAprobadas: Comparacion[] = [];
  imagenesCotizacionesAprobadas: any[] = [];
  imagenesComparacionesAprobadas: any[] = [];
  imagenesAprobadas: any[] = [];
  constructor(private cotizacionesService: CotizacionComparativaService, private cotizacionService: VistaCotizacionesService,   private modalController: ModalController) {}
  usuario = {};
  ngOnInit() {
    this.obtenerCotizacionesAprobadas();
    this.obtenerComparacionesAprobadas();
    this.obtenerTodasLasImagenesAprobadas(); // Llamamos aquí para cargar las imágenes
  }


  obtenerCotizacionesAprobadas() {
    this.cotizacionService.getCotizaciones().subscribe(data => {
      this.cotizacionesAprobadas = data.filter((cot: Cotizacion) => cot.estado === 'Aceptada');
    });
  }

  obtenerComparacionesAprobadas() {
    this.cotizacionesService.obtenerComparaciones().subscribe(data => {
      this.comparacionesAprobadas = data
        .map(comparacion => {
          const comparacionData = comparacion.payload.doc.data() as Comparacion;
          return { id: comparacion.payload.doc.id, ...comparacionData };
        })
        .filter(comparacion => comparacion.estado === 'Aceptada'); // Solo selecciona las comparaciones con estado 'Aceptada'
    });
  }


// En lugar de intentar acceder directamente a imagen.imagenUrl, asegurémonos de que el campo esté correctamente referenciado y mapeado.
obtenerTodasLasImagenesAprobadas() {
  this.cotizacionService.getImagenesCotizacionesAprobadas().subscribe(imagenesCotizaciones => {
    console.log('Imagenes Cotizaciones Aprobadas:', imagenesCotizaciones);
    this.cotizacionesService.getImagenesComparacionesAprobadas().subscribe(imagenesComparaciones => {
      console.log('Imagenes Comparaciones Aprobadas:', imagenesComparaciones);

      // Normalizamos las imágenes para que todas tengan la propiedad 'imagenUrl', 'nombre', y 'id'
      const imagenesNormalizadasCotizaciones = imagenesCotizaciones.map(imagen => ({
        imagenUrl: imagen.imagenUrl || imagen.imagen, // Asegúrate de que sea 'imagenUrl'
        nombre: imagen.nombre || 'Nombre no disponible',
        tipo: 'cotizacion', // Asegúrate de que el nombre esté presente
        id: imagen.id // Asegúrate de que cada imagen tenga 'id'
      }));

      const imagenesNormalizadasComparaciones = imagenesComparaciones.map(imagen => ({
        imagenUrl: imagen.imagen || imagen.imagenUrl, // Normaliza el nombre de la propiedad de la imagen
        nombre: imagen.nombre || 'Nombre no disponible',
        tipo: 'comparativa',
        id: imagen.id // Asegúrate de que cada imagen tenga 'id'
      }));

      // Combina las imágenes de ambas colecciones
      this.imagenesAprobadas = [...imagenesNormalizadasCotizaciones, ...imagenesNormalizadasComparaciones];
      console.log('Imagenes Aprobadas:', this.imagenesAprobadas);  // Verifica que las imágenes se combinan correctamente
    });
  });
}




  archivarCotizacion(cotizacion: Cotizacion) {
    if (cotizacion.id) {  // Verifica que 'id' no sea undefined
      cotizacion.estado = 'Archivado';

      this.cotizacionService.actualizarEstadoCotizacion(cotizacion.id, 'Archivado', '').then(() => {
        this.cotizacionesAprobadas = this.cotizacionesAprobadas.filter((cot) => cot.estado === 'Aceptada');
        console.log('Cotización archivada:', cotizacion);
      }).catch((error) => {
        console.error('Error al archivar la cotización:', error);
      });
    } else {
      console.error('No se puede archivar la cotización porque el id es undefined');
    }
  }


  archivarComparacion(comparacion: Comparacion) {
    if (comparacion.id) {  // Verifica que 'id' no sea undefined
      comparacion.estado = 'Archivado';

      this.cotizacionesService.actualizarComparacion(comparacion.id, { estado: 'Archivado' }).then(() => {
        this.comparacionesAprobadas = this.comparacionesAprobadas.filter((comp) => comp.estado === 'Archivado');
        console.log('Comparación archivada:', comparacion);
      }).catch((error) => {
        console.error('Error al archivar la comparación:', error);
      });
    } else {
      console.error('No se puede archivar la comparación porque el id es undefined');
    }
  }
  archivarImagen(imagen: any) {
    console.log('Archivar Imagen:', imagen);

    // Verifica que la imagen tenga un id válido
    if (!imagen.id) {
      console.error('Error: La imagen no tiene ID');
      return; // Detener la ejecución si no hay ID
    }

    // Verifica que la propiedad 'tipo' esté definida antes de proceder
    if (!imagen.tipo) {
      console.error('Error: La imagen no tiene tipo definido');
      return; // Detener la ejecución si no hay tipo
    }

    imagen.estado = 'Archivado';  // Actualizamos el estado a 'Archivado'

    console.log('Tipo de imagen:', imagen.tipo);  // Verifica el tipo de imagen

    if (imagen.tipo === 'comparativa') {
      this.cotizacionesService.actualizarImagenComparativa(imagen.id, { estado: 'Archivado' }).then(() => {
        console.log('Imagen de comparativa archivada:', imagen);
        // Actualizar la imagen en el array después de archivar
        const index = this.imagenesAprobadas.findIndex(img => img.id === imagen.id);
        if (index !== -1) {
          this.imagenesAprobadas[index] = imagen;
        }
      }).catch(error => {
        console.error('Error al archivar imagen de comparativa:', error);
      });
    } else if (imagen.tipo === 'cotizacion') {
      this.cotizacionesService.actualizarImagenCotizacion(imagen.id, { estado: 'Archivado' }).then(() => {
        console.log('Imagen de cotización archivada:', imagen);
        // Actualizar la imagen en el array después de archivar
        const index = this.imagenesAprobadas.findIndex(img => img.id === imagen.id);
        if (index !== -1) {
          this.imagenesAprobadas[index] = imagen;
        }
      }).catch(error => {
        console.error('Error al archivar imagen de cotización:', error);
      });
    } else {
      console.error('Error: Tipo de imagen desconocido', imagen.tipo);
    }
  }





  obtenerMenorPrecio(insumo: string): number {
    const preciosInsumo = this.comparacionesAprobadas
      .reduce((acc, comparacion) => acc.concat(comparacion.cotizacionesPrecios ?? []), [] as { empresa: string; insumo: string; precio: number }[])
      .filter(cot => cot.insumo === insumo)
      .map(cot => cot.precio);

    return preciosInsumo.length > 0 ? Math.min(...preciosInsumo) : -1;
  }

  async openChat(usuario: any) {
    const modal = await this.modalController.create({
      component: ChatModalComponent,
      componentProps: { usuario, receptorId: usuario.uid } // Pasa el usuario y el ID del receptor
    });
    return await modal.present();
  }


}
