import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VistaCotizacionesService } from '../services/vista-cotizaciones.service';
import { CotizacionComparativaService } from '../services/cotizacion-comparativa.service';
import { ChatModalComponent } from '../chat-modal/chat-modal.component';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-menu-cotizador',
  templateUrl: './menu-cotizador.page.html',
  styleUrls: ['./menu-cotizador.page.scss'],
})
export class MenuCotizadorPage implements OnInit {
  cotizacionesPendientesCount: number = 0;
  comparacionesPendientesCount: number = 0;
  cotizacionesAceptadasCount: number = 0;
  comparacionesAceptadasCount: number = 0;
  totalAceptadas: number = 0;

  usuario = {};

  constructor(
    private router: Router,
    private cotizacionesService: VistaCotizacionesService,
    private comparacionesService: CotizacionComparativaService,
    private modalController: ModalController
  ) {}

  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
  }

  ngOnInit() {
    this.cotizacionesService.getCotizacionesPendientesCount().subscribe(cotizacionesCount => {
      this.cotizacionesService.getImagenesPendientesCount().subscribe(imagenesCount => {
        this.cotizacionesPendientesCount = cotizacionesCount + imagenesCount;
      });
    });

    this.comparacionesService.getComparacionesPendientesCount().subscribe(comparacionesCount => {
      this.comparacionesService.getComparacionesImagenesPendientesCount().subscribe(imagenesCount => {
        this.comparacionesPendientesCount = comparacionesCount + imagenesCount;
      });
    });

    this.cotizacionesService.getCotizacionesAceptadasCount().subscribe(cotizacionesCount => {
      this.cotizacionesService.getImagenesAceptadasCount().subscribe(imagenesCotizacionesCount => {
        this.comparacionesService.getComparacionesAceptadasCount().subscribe(comparacionesCount => {
          this.comparacionesService.getComparacionesImagenesAceptadasCount().subscribe(imagenesComparacionesCount => {
            this.cotizacionesAceptadasCount = (cotizacionesCount || 0) + (imagenesCotizacionesCount || 0);
            this.comparacionesAceptadasCount = (comparacionesCount || 0) + (imagenesComparacionesCount || 0);

            this.totalAceptadas = this.cotizacionesAceptadasCount + this.comparacionesAceptadasCount;
          });
        });
      });
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
