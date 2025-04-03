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

  isDarkMode = false;

  constructor(private authService: AuthService, private router: Router) {
    const storedMode = localStorage.getItem('darkMode');
    if (storedMode !== null) {
      this.isDarkMode = storedMode === 'true';
      document.body.classList.toggle('dark', this.isDarkMode);
    }
  }
  initializeTheme() {
    const savedTheme = localStorage.getItem('darkMode') === 'true';
    this.isDarkMode = savedTheme;
    document.body.classList.toggle('dark', savedTheme);
  }
  toggleDarkMode(event: any) {
    this.isDarkMode = event.detail.checked;
    document.body.classList.toggle('dark', this.isDarkMode);
    localStorage.setItem('darkMode', this.isDarkMode.toString());
  }

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
