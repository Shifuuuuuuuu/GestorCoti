import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  public appPages = [
  { title: 'Panel de Gestión', url: '/home', icon: 'home', roles: ['Aprobador/Editor','Admin'] },
  { title: 'Administrar Cotizaciones', url: '/menu-oc', icon: 'reader', roles: ['Aprobador/Editor','Editor','Admin'] },
  { title: 'Panel Administrativo', url: '/menu-admin', icon: 'settings', roles: ['Admin'] },
  { title: 'Mi Solped', url: '/menu-solpe', icon: 'document-text', roles: ['Generador solped', 'Aprobador/Editor','Admin'] },
  { title: 'Mi Perfil', url: '/perfil-usuario', icon: 'person-circle', roles: ['Generador solped', 'Editor', 'Aprobador/Editor','Admin'] },
  ];

  filteredPages: any[] = [];
  isDarkMode = false;
  public photoURL: string = 'assets/img/default-avatar.jpg';
  constructor(private authService: AuthService, private router: Router, private afs: AngularFirestore  ) {}

  ngOnInit() {
    this.loadUserProfile();
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
  private loadUserProfile() {
    const uid = localStorage.getItem('userId');
    if (!uid) return;
    this.afs.doc<{ photoURL: string }>(`Usuarios/${uid}`)
      .valueChanges()
      .subscribe(user => {
        if (user?.photoURL) {
          this.photoURL = user.photoURL;
        }
      });
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

