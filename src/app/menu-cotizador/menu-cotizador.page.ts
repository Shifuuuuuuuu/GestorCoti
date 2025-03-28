import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChatModalComponent } from '../chat-modal/chat-modal.component';
import { MenuController, ModalController } from '@ionic/angular';

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
    private modalController: ModalController,
    private menu: MenuController
  ) {}

  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
  }

  ngOnInit() {

  }
  ionViewWillEnter() {
    this.menu.enable(true);
  }
  async openChat(usuario: any) {
    const modal = await this.modalController.create({
      component: ChatModalComponent,
      componentProps: { usuario, receptorId: usuario.uid }
    });
    return await modal.present();
  }
}
