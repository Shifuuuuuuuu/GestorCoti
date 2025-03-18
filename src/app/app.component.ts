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
    { title: 'Home', url: '/home', icon: 'home' },
    { title: 'Menu solpe', url: '/menu-solpe', icon: 'document-text' },
    { title: 'Menu cotizador', url: '/menu-cotizador', icon: 'document-attach' },
    { title: 'Perfil', url: '/perfil-usuario', icon: 'person-circle' },
    { title: 'chat', url: '/chat', icon: 'chatbubbles' },
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
