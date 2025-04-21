import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  public appPages = [
    { title: 'Menú de gestor', url: '/home', icon: 'home', roles: ['Aprobador/Editor'] },
    { title: 'Menú SOLPED', url: '/menu-solpe', icon: 'document-text', roles: ['Generador solped', 'Aprobador/Editor'] },
    { title: 'Menú de cruce de precios', url: '/menu-cotizador', icon: 'document-attach', roles: ['Editor', 'Aprobador/Editor'] },
    { title: 'Perfil de usuario', url: '/perfil-usuario', icon: 'person-circle', roles: ['Generador solped', 'Editor', 'Aprobador/Editor'] },
  ];

  filteredPages: any[] = [];
  isDarkMode = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    // Activar tema si está guardado
    const storedMode = localStorage.getItem('darkMode');
    if (storedMode !== null) {
      this.isDarkMode = storedMode === 'true';
      document.body.classList.toggle('dark', this.isDarkMode);
    }
    this.authService.userRole$.subscribe((role) => {
      if (role) {
        this.cargarMenuPorRol(role);
      } else {
        this.filteredPages = [];
      }
    });

    const currentRole = localStorage.getItem('userRole');
    if (currentRole) {
      this.cargarMenuPorRol(currentRole);
    }
  }

  cargarMenuPorRol(role: string) {
    this.filteredPages = this.appPages.filter(page => page.roles.includes(role));
  }

  toggleDarkMode(event: any) {
    this.isDarkMode = event.detail.checked;
    document.body.classList.toggle('dark', this.isDarkMode);
    localStorage.setItem('darkMode', this.isDarkMode.toString());
  }

  async logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    this.filteredPages = [];
    this.authService.setUserRole('');
    await this.authService.logout();
    this.router.navigate(['/iniciar-sesion']);
  }
}

