import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, ModalController } from '@ionic/angular';
import { ChatModalComponent } from '../chat-modal/chat-modal.component';
import { AngularFirestore } from '@angular/fire/compat/firestore';

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
  preAprobadasCount: number = 0;

  usuario = {};

  constructor(
    private router: Router,
    private modalController: ModalController,
    private menu: MenuController,
    private firestore: AngularFirestore,
  ) {}

  navigateTo(page: string) {
    if (page === 'visualizacion-solped') {
      this.preAprobadasCount = 0;
    }
    this.router.navigate([`/${page}`]);
  }

  ngOnInit() {
    this.contarPreAprobadas();
  }

  ionViewWillEnter() {
    this.menu.enable(true);
  }

  contarPreAprobadas() {
    this.firestore.collection('solpes', ref => ref.where('estatus', '==', 'Preaprobado'))
      .get()
      .subscribe(snapshot => {
        this.preAprobadasCount = snapshot.size;
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
