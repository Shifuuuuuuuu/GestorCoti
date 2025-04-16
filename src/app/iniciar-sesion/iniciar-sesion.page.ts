import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { AlertController, MenuController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-iniciar-sesion',
  templateUrl: './iniciar-sesion.page.html',
  styleUrls: ['./iniciar-sesion.page.scss'],
})
export class IniciarSesionPage implements OnInit {
  constructor(
    private router: Router,
    private afAuth: AngularFireAuth,
    private toastController: ToastController,
    private alertController: AlertController,
    private firestore: AngularFirestore,
    private menu: MenuController
  ) {}

  ngOnInit() {
    this.verificarSesion();
  }

  async verificarSesion() {
    const userId = localStorage.getItem('userId'); // Verifica si hay un usuario guardado
    if (userId) {
      try {
        console.log('Usuario recuperado del localStorage:', userId);
        const userDoc = await this.firestore.collection('Usuarios').doc(userId).get().toPromise();
        if (userDoc && userDoc.exists) {
          const userData = userDoc.data() as any;
          this.redirigirPorRol(userData.role);
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
        localStorage.removeItem('userId'); // Si hay un error, limpiar sesión
      }
    }
  }

  async login() {
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;

    // El checkbox puede estar presente, pero no lo usamos para guardar la sesión
    const recordarSesion = (document.getElementById('recordarSesion') as HTMLInputElement)?.checked;

    if (!email || !password) {
      this.presentToast('Por favor, ingrese un correo y una contraseña válidos', 'warning');
      return;
    }

    try {
      const userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (user) {
        if (user.emailVerified) {
          const userDoc = await this.firestore.collection('Usuarios').doc(user.uid).get().toPromise();

          if (userDoc && userDoc.exists) {
            const userData = userDoc.data() as any;

            // ✅ Guardamos SIEMPRE el userId en localStorage
            localStorage.setItem('userId', user.uid);
            console.log('Guardado userId:', user.uid);

            // 🔄 Aquí podrías guardar otra info adicional si lo necesitas para el perfil
            localStorage.setItem('userEmail', user.email || '');

            this.redirigirPorRol(userData.role);
          } else {
            this.presentToast('Usuario no encontrado en la base de datos.', 'danger');
          }
        } else {
          this.presentToast('Por favor, verifica tu correo electrónico antes de iniciar sesión.', 'danger');
        }
      }
    } catch (error: any) {
      this.presentToast(error.message || 'Error al iniciar sesión.', 'danger');
    }
  }



  redirigirPorRol(userRole: string) {
    if (userRole === 'Editor') {
      this.router.navigate(['/menu-cotizador']);
    } else if (userRole === 'Aprobador/Editor') {
      this.router.navigate(['/home']);
    } else if (userRole === 'Generador solped') {
      this.router.navigate(['/menu-solpe']);
    } else {
      this.presentToast('No tiene un rol asignado. Contacte con soporte.', 'danger');
    }
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 3000,
      position: 'top',
    });
    toast.present();
  }

  async resetPassword(event: Event) {
    event.preventDefault();
    const alert = await this.alertController.create({
      header: 'Recuperar Contraseña',
      message: 'Ingrese su correo electrónico para enviarle un enlace de recuperación.',
      inputs: [{ name: 'email', type: 'email', placeholder: 'Tu correo electrónico' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar',
          handler: async (data) => {
            const email = data.email;
            if (!email) {
              this.presentToast('Por favor, ingrese un correo válido.', 'warning');
              return;
            }
            try {
              await this.afAuth.sendPasswordResetEmail(email);
              this.presentToast('Correo de recuperación enviado. Revisa tu bandeja de entrada.', 'success');
            } catch (error: any) {
              this.presentToast(error.message || 'Error al enviar el correo de recuperación.', 'danger');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  goToRegister(event: Event) {
    event.preventDefault();
    this.router.navigate(['/registrar-usuario']);
  }

  preventFormSubmit(event: Event) {
    event.preventDefault();
  }
  ionViewWillEnter() {
    this.menu.enable(false);
  }
}
