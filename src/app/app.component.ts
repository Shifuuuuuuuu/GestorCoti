import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import versionData from '../assets/version.json';
import { AlertController, ModalController } from '@ionic/angular';
import Swiper from 'swiper';
import { NotificacionesService } from './services/notificaciones.service';
import { NotificacionesComponent } from './notificaciones/notificaciones.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  version = versionData.version;
  tieneNotificaciones: boolean = false;

  public appPages = [
  { title: 'Aprobaciones Cotizaciones', url: '/home', icon: 'home', roles: ['Aprobador/Editor','Admin'] },
  { title: 'Administrar Cotizaciones', url: '/menu-oc', icon: 'reader', roles: ['Editor','Admin'] },
  { title: 'Panel Administrativo', url: '/menu-admin', icon: 'settings', roles: ['Admin'] },
  { title: 'Mi Solped', url: '/menu-solpe', icon: 'document-text', roles: ['Generador solped','Admin'] },
  { title: 'Mi Perfil', url: '/perfil-usuario', icon: 'person-circle', roles: ['Generador solped', 'Editor', 'Aprobador/Editor','Admin'] },
  ];

  filteredPages: any[] = [];
  isDarkMode = false;
  public photoURL: string = 'assets/img/default-avatar.jpg';
  constructor(private modalController: ModalController,private authService: AuthService, private router: Router, private afs: AngularFirestore,private alertController: AlertController,private notificaciones: NotificacionesService) {}

ngOnInit() {
  this.loadUserProfile();
  this.notificaciones.verificarOCNuevasAprobadasTiempoReal((tiene: boolean) => {
    this.tieneNotificaciones = tiene;
  });


  // Mostrar mensaje de versión si hay cambios
  const ultimaVersion = localStorage.getItem('ultimaVersionVista');
  if (ultimaVersion !== versionData.version) {
    this.mostrarMensajeVersion(versionData.mensaje, versionData.version);
  }

  // Modo oscuro
  const storedMode = localStorage.getItem('darkMode');
  if (storedMode !== null) {
    this.isDarkMode = storedMode === 'true';
    document.body.classList.toggle('dark', this.isDarkMode);
  }

  // Rol del usuario
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

  setTimeout(() => {
    const container = document.querySelector('.menu-swiper');
    if (container) {
      new Swiper(container as HTMLElement, {
        loop: true,
        autoplay: {
          delay: 1,
          disableOnInteraction: false,
        },
      });
    }
  }, 200);
}
async abrirNotificaciones() {
  const modal = await this.modalController.create({
    component: NotificacionesComponent,
    cssClass: 'modal-notificaciones', // puedes personalizar este estilo
    showBackdrop: true
  });
  await modal.present(); // ✅ esta línea está perfecta
}

async mostrarMensajeVersion(mensaje: string, version: string) {
  const alert = await this.alertController.create({
    header: `Novedades v${version}`,
    message: mensaje,
    buttons: ['OK']
  });
  await alert.present();
  localStorage.setItem('ultimaVersionVista', version);
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

