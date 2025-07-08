import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { MenuController, ModalController, NavController, ToastController } from '@ionic/angular';
import { AppUser } from '../Interface/IUser';
import { ChatModalComponent } from '../chat-modal/chat-modal.component';

@Component({
  selector: 'app-perfil-usuario',
  templateUrl: './perfil-usuario.page.html',
  styleUrls: ['./perfil-usuario.page.scss'],
})
export class PerfilUsuarioPage implements OnInit {
  profileImageUrl: string = '';
  defaultProfileImage: string = 'assets/icon/default-profile.png';
  user: AppUser | null = null;
  isEditing: boolean = false;
  errorMessage: string | undefined;
  isDarkMode = false;
  tempNombreCompleto: string = '';
  tempEmail: string = '';
  tempRut: string = '';
  tempTelefono: string = '';

  usuario = {};

  correosPermitidos: string[] = [
    'gmanzor@xtrememining.cl',
    'jcubillos@xtrememining.cl',
    'tallerpmchs@xtrememining.cl',
    'tallerxtreme17@gmail.com',
    'ralfaro12344@xtrememining.cl',
    'mmarchant@xtrememining.cl',
    'bodegacaneche@xtremeservicios.cl',
    'amartinez@xtrememining.cl',
    'avacher@xtrememining.cl',
    'rsanhueza@xtrememining.cl',
    'ahernandez@xtrememining.cl',
    'dlizama@xtrememining.cl',
    'cpalma@xtrememining.cl',
    'mballesteros@xtrememining.cl'
  ];

  constructor(
    private authService: AuthService,
    private toastController: ToastController,
    private menuController: MenuController,
    private modalController: ModalController,
    private menu: MenuController,
    private navCtrl: NavController
  ) {}

  async ngOnInit() {
    this.initializeDarkMode();

    const userId = localStorage.getItem('userId');
    if (userId) {
      await this.loadUserData(userId);
    } else {
      this.errorMessage = 'Error: no se encontró el usuario.';
    }
  }
  initializeDarkMode() {
    const storedMode = localStorage.getItem('darkMode');
    this.isDarkMode = storedMode === 'true';
    document.body.classList.toggle('dark', this.isDarkMode);
  }

  toggleDarkMode(event: any) {
    this.isDarkMode = event.detail.checked;
    document.body.classList.toggle('dark', this.isDarkMode);
    localStorage.setItem('darkMode', this.isDarkMode.toString());
  }
  toggleDarkModeManualmente() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark', this.isDarkMode);
    localStorage.setItem('darkMode', this.isDarkMode.toString());
  }

  goBack() {
    this.navCtrl.back();
  }
  async loadUserData(userId: string) {
    try {
      const userResult = await this.authService.getUserById(userId);

      if (userResult) {
        if (this.correosPermitidos.includes(userResult.email)) {
          this.user = userResult;
          this.profileImageUrl = this.user.photoURL ? this.user.photoURL : this.defaultProfileImage;
        } else {
          this.errorMessage = 'El correo del usuario no está permitido.';
          console.warn(this.errorMessage);
        }
      } else {
        this.errorMessage = 'No se encontró el usuario.';
        console.warn(this.errorMessage);
      }
    } catch (error) {
      console.error('Error al cargar los datos del usuario:', error);
      this.errorMessage = 'Ocurrió un error al cargar los datos del usuario.';
    }
  }

  openMenu() {
    this.menuController.open();
  }

  ionViewWillEnter() {
    this.menu.enable(true);
  }

  async uploadProfileImage(event: any) {
    const file = event.target.files[0];
    if (file) {
      try {
        const base64Image = await this.convertToBase64(file);
        if (this.user) {
          this.user.photoURL = base64Image;
          await this.authService.updateUser(this.user);
          this.showToast('Imagen de perfil actualizada correctamente.', 'success');
        } else {
          this.showToast('No se pudo actualizar la imagen de perfil. Usuario no definido.', 'danger');
        }
      } catch (error) {
        this.showToast('No se pudo actualizar la imagen de perfil.', 'danger');
      }
    } else {
      this.showToast('Por favor, selecciona una imagen para subir.', 'warning');
    }
  }

  private convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  editProfile() {
    this.isEditing = true;
    this.tempNombreCompleto = this.user?.fullName || '';
    this.tempEmail = this.user?.email || '';
    this.tempRut = this.user?.rut || '';
    this.tempTelefono = this.user?.phone || '';
  }

  async saveProfile() {
    try {
      if (this.user) {
        this.user.fullName = this.tempNombreCompleto;
        this.user.rut = this.tempRut;
        this.user.phone = this.tempTelefono;
        if (!this.user.photoURL) {
          delete this.user.photoURL;
        }

        await this.authService.updateUser(this.user);
        this.showToast('Los cambios se guardaron correctamente.', 'success');
        this.isEditing = false;
      }
    } catch (error) {
      console.error('Error al guardar el perfil:', error);
      this.showToast('Hubo un problema al guardar los cambios.', 'danger');
    }
  }


  cancelEdit() {
    this.isEditing = false;
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.loadUserData(userId);
    } else {
      this.errorMessage = 'No se pudo encontrar el usuario.';
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
    });
    toast.present();
  }

  async openChat(usuario: any) {
    const modal = await this.modalController.create({
      component: ChatModalComponent,
      componentProps: { usuario, receptorId: usuario.uid }
    });
    return await modal.present();
  }
}
