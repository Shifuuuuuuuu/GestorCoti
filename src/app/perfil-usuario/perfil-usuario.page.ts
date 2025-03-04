import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { MenuController, ModalController, ToastController } from '@ionic/angular';
import { AppUser } from '../Interface/IUser';
import { ChatModalComponent } from '../chat-modal/chat-modal.component';

@Component({
  selector: 'app-perfil-usuario',
  templateUrl: './perfil-usuario.page.html',
  styleUrls: ['./perfil-usuario.page.scss'],
})
export class PerfilUsuarioPage implements OnInit {
  profileImageUrl: string = ''; // URL de la imagen de perfil
  defaultProfileImage: string = 'assets/icon/default-profile.png'; // Ruta del icono predeterminado
  user: AppUser | null = null;
  isEditing: boolean = false;
  userEmail!: string | undefined;
  errorMessage: string | undefined;
  tempNombreCompleto: string = '';
  tempEmail: string = '';
  tempRut: string = '';
  tempTelefono: string = '';
  unreadNotificationsCount: number = 0;
  usuario = {};
  constructor(
    private authService: AuthService,
    private toastController: ToastController,
    private menuController: MenuController,
    private modalController: ModalController
  ) {}
    // Abrir menú manualmente
openMenu() {
  this.menuController.open();
}
  async ngOnInit() {
    const userId = localStorage.getItem('userId');  // Obtenemos el UID del usuario desde localStorage
    if (userId) {
      this.loadUserData(userId);  // Cargamos los datos del usuario usando el UID
    } else {
      this.errorMessage = 'Error: no se encontró el usuario.';
    }
  }

  async loadUserData(userId: string) {
    try {
      const userResult = await this.authService.getUserById(userId);  // Obtén el usuario de Firestore
      if (userResult) {
        this.user = userResult;
        this.profileImageUrl = this.user.photoURL || this.defaultProfileImage;  // Asigna la URL de la imagen o una predeterminada
        console.log('Usuario cargado:', this.user);
      } else {
        this.errorMessage = 'No se encontró el usuario.';
      }
    } catch (error) {
      console.error('Error al cargar los datos del usuario:', error);
      this.errorMessage = 'Ocurrió un error al cargar los datos del usuario.';
    }
  }


  async uploadProfileImage(event: any) {
    const file = event.target.files[0];
    if (file) {
      try {
        // Convertir el archivo a Base64
        const base64Image = await this.convertToBase64(file);

        // Verificar si `this.user` no es null antes de asignar valores
        if (this.user) {
          // Asignar la URL generada al usuario
          this.user.photoURL = base64Image;

          // Guardar la URL en Firestore usando AuthService
          await this.authService.updateUser(this.user);

          console.log('Imagen de perfil actualizada correctamente.');
          this.showToast('Imagen de perfil actualizada correctamente.', 'success');
        } else {
          console.error('El usuario no está definido.');
          this.showToast('No se pudo actualizar la imagen de perfil. Usuario no definido.', 'danger');
        }
      } catch (error) {
        console.error('Error al subir la imagen de perfil:', error);
        this.showToast('No se pudo actualizar la imagen de perfil.', 'danger');
      }
    } else {
      console.error('No se seleccionó ningún archivo.');
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
    console.log('Editando perfil:', this.isEditing); // Debug
    this.tempNombreCompleto = this.user?.fullName || '';
    this.tempEmail = this.user?.email || '';
    this.tempRut = this.user?.rut || '';
    this.tempTelefono = this.user?.phone || '';
  }


  async saveProfile() {
    try {
      if (this.user) {
        this.user.fullName = this.tempNombreCompleto; // Usamos `fullName` en vez de `Nombre_completo`
        this.user.rut = this.tempRut; // Usamos `rut` en vez de `Rut`
        this.user.phone = this.tempTelefono; // Usamos `phone` en vez de `Telefono`
        await this.authService.updateUser(this.user);  // Método para actualizar el usuario
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
    const userId = localStorage.getItem('userId');  // Obtenemos el UID del usuario desde localStorage
    if (userId) {
      this.loadUserData(userId);  // Pasamos el UID a la función loadUserData
    } else {
      this.errorMessage = 'No se pudo encontrar el usuario.';
    }
  }

  // Método para mostrar un mensaje con ToastController
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
      componentProps: { usuario, receptorId: usuario.uid } // Pasa el usuario y el ID del receptor
    });
    return await modal.present();
  }
}
