import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  public appPages = [
    { title: 'Menu de gestor', url: '/home', icon: 'home' },
    { title: 'Menu solped', url: '/menu-solpe', icon: 'document-text' },
    { title: 'Menu precios', url: '/menu-cotizador', icon: 'document-attach' },
    { title: 'Perfil', url: '/perfil-usuario', icon: 'person-circle' },
  ];

  constructor(private authService: AuthService, private router: Router) {}
  async logout() {
    try {
      await this.authService.logout();
      console.log('Usuario ha cerrado sesión.');
      this.router.navigate(['/iniciar-sesion']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}
