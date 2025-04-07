import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-menu-solpe',
  templateUrl: './menu-solpe.page.html',
  styleUrls: ['./menu-solpe.page.scss'],
})
export class MenuSolpePage implements OnInit {
  cotizacionesPendientesCount: number = 0;
  comparacionesPendientesCount: number = 0;
  cotizacionesAceptadasCount: number = 0;
  comparacionesAceptadasCount: number = 0;
  totalAceptadas: number = 0;

  usuario = {};

  constructor(
    private router: Router,
    private menu: MenuController,
    private authService: AuthService
  ) {}

  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
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

  ngOnInit() {

  }


}
