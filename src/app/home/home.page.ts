import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, ModalController } from '@ionic/angular';
import { ChatModalComponent } from '../chat-modal/chat-modal.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit  {
  cotizacionesPendientesCount: number = 0;
  comparacionesPendientesCount: number = 0;
  cotizacionesAceptadasCount: number = 0;
  comparacionesAceptadasCount: number = 0;
  totalAceptadas: number = 0;

  usuario = {};

  constructor(
    private router: Router,
    private modalController: ModalController
  ) {}

  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
  }

  ngOnInit() {
  }

  async openChat(usuario: any) {
    const modal = await this.modalController.create({
      component: ChatModalComponent,
      componentProps: { usuario, receptorId: usuario.uid }
    });
    return await modal.present();
  }
}
