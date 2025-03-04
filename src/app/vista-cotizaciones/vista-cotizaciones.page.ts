import { Component, OnInit } from '@angular/core';
import { Cotizacion } from '../Interface/ICotizacion';
import {VistaCotizacionesService } from '../services/vista-cotizaciones.service'
import { AlertController, ModalController } from '@ionic/angular';
import { ChatModalComponent } from '../chat-modal/chat-modal.component';
@Component({
  selector: 'app-vista-cotizaciones',
  templateUrl: './vista-cotizaciones.page.html',
  styleUrls: ['./vista-cotizaciones.page.scss'],
})
export class VistaCotizacionesPage implements OnInit {
  cotizaciones: any[] = [];
  imagenes: any[] = [];
  segment: string = 'pendientes-cotizaciones'; // Segmento por defecto
  cotizacionesPendientes: any[] = [];
  imagenesPendientes: any[] = [];

  constructor(
    private cotizacionesService: VistaCotizacionesService,
    private alertController: AlertController,
    private modalController: ModalController
  ) {}
  usuario = {};
  ngOnInit() {
    this.cotizacionesService.getCotizaciones().subscribe((data) => {
      this.cotizaciones = data;
      console.log('Cotizaciones:', this.cotizaciones); // Verifica los datos de las cotizaciones
      this.filtrarCotizacionesPendientes();
    });

    this.cotizacionesService.getImagenes().subscribe((data) => {
      this.imagenes = data;
      console.log('Imagenes:', this.imagenes); // Verifica los datos de las imágenes
      this.filtrarImagenesPendientes();
    });
  }


  // Función para filtrar cotizaciones pendientes
  filtrarCotizacionesPendientes() {
    this.cotizacionesPendientes = this.cotizaciones.filter(
      (cotizacion) => cotizacion.estado === 'Pendiente'
    );
  }

  // Función para filtrar imágenes pendientes
  filtrarImagenesPendientes() {
    this.imagenesPendientes = this.imagenes.filter(
      (imagen) => imagen.estado === 'Pendiente'
    );
    console.log(this.imagenesPendientes); // Verifica los valores
  }


  async actualizarEstado(
    id: string | undefined,
    estado: 'Aceptada' | 'Rechazada',
    tipo: 'cotizacion' | 'imagen'
  ) {
    if (!id) {
      console.error('ID no definido');
      return;
    }

    // Crear la alerta para confirmar la acción
    const alert = await this.alertController.create({
      header: `Confirmar ${estado}`,
      inputs: [
        {
          name: 'comentario',
          type: 'text',
          placeholder: 'Agrega un comentario',
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Confirmar',
          handler: (data) => {
            // Actualizar el estado con el comentario
            if (tipo === 'cotizacion') {
              this.cotizacionesService.actualizarEstadoCotizacion(
                id,
                estado,
                data.comentario || ''
              );
            } else if (tipo === 'imagen') {
              this.cotizacionesService.actualizarEstadoImagen(
                id,
                estado,
                data.comentario || ''
              );
            }
            // Refrescar las listas
            this.filtrarCotizacionesPendientes();
            this.filtrarImagenesPendientes();
          },
        },
      ],
    });

    await alert.present();
  }

  // Función para aceptar una cotización
  aceptarCotizacion(id: string | undefined) {
    this.actualizarEstado(id, 'Aceptada', 'cotizacion');
  }

  // Función para rechazar una cotización
  rechazarCotizacion(id: string | undefined) {
    this.actualizarEstado(id, 'Rechazada', 'cotizacion');
  }

  // Función para aceptar una imagen
  aceptarImagen(id: string | undefined) {
    this.actualizarEstado(id, 'Aceptada', 'imagen');
  }

  // Función para rechazar una imagen
  rechazarImagen(id: string | undefined) {
    this.actualizarEstado(id, 'Rechazada', 'imagen');
  }
  async openChat(usuario: any) {
    const modal = await this.modalController.create({
      component: ChatModalComponent,
      componentProps: { usuario, receptorId: usuario.uid } // Pasa el usuario y el ID del receptor
    });
    return await modal.present();
  }
}
