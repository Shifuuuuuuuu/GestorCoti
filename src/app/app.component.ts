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
      { title: 'Menu de gestor', url: '/home', icon: 'home', roles: ['Generador de solped', 'Editor', 'Aprobador/Editor'] },
      { title: 'Menu solped', url: '/menu-solpe', icon: 'document-text', roles: ['Generador de solped', 'Aprobador/Editor'] },
      { title: 'Menu precios', url: '/menu-cotizador', icon: 'document-attach', roles: ['Editor', 'Aprobador/Editor'] },
      { title: 'Perfil', url: '/perfil-usuario', icon: 'person-circle', roles: ['Generador de solped', 'Editor', 'Aprobador/Editor'] },
    ];

    isDarkMode = false;

    constructor(private authService: AuthService, private router: Router) {
      const storedMode = localStorage.getItem('darkMode');
      if (storedMode !== null) {
        this.isDarkMode = storedMode === 'true';
        document.body.classList.toggle('dark', this.isDarkMode);
      }
    }


    getFilteredPages(): any[] {
      const userRole = localStorage.getItem('userRole') ?? '';
      return this.appPages.filter(page => page.roles.includes(userRole));
    }


    initializeTheme() {
      const savedTheme = localStorage.getItem('darkMode') === 'false';
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
        localStorage.removeItem('userId');

        await this.authService.logout();
        console.log('Usuario ha cerrado sesión.');
        this.router.navigate(['/iniciar-sesion']);
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      }
    }

  }
