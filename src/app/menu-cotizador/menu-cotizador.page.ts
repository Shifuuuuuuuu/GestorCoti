import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChatModalComponent } from '../chat-modal/chat-modal.component';
import { MenuController, ModalController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';

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
    private menu: MenuController,
    private authService: AuthService,
    private firestore: AngularFirestore
  ) {}

  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
  }

  ngOnInit() {
    this.contarComparacionesSolicitadas();

  }
  goToProfile() {
    this.router.navigate(['/perfil-usuario']);
  }
  async logout() {
    try {
      localStorage.removeItem('userId');

      await this.authService.logout();
      console.log('Usuario ha cerrado sesión.');
      this.router.navigate(['/iniciar-sesion']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
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
  contarComparacionesSolicitadas() {
    this.firestore.collection('solpes', ref =>
      ref.where('estatus', '==', 'Solicitado')
    ).get().subscribe(snapshot => {
      this.comparacionesPendientesCount = snapshot.size;
    });
  }

}
