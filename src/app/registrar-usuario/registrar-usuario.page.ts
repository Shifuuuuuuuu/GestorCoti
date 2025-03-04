import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ToastController } from '@ionic/angular';
import { AppUser } from '../Interface/IUser';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registrar-usuario',
  templateUrl: './registrar-usuario.page.html',
  styleUrls: ['./registrar-usuario.page.scss'],
})
export class RegistrarUsuarioPage implements OnInit {
  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private toastController: ToastController,
    private router: Router
  ) {}

  async register() {
    const fullName = (document.getElementById('fullName') as HTMLInputElement).value.trim();
    const rut = (document.getElementById('rut') as HTMLInputElement).value.trim();
    const email = (document.getElementById('email') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('phone') as HTMLInputElement).value.trim();
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const role = (document.getElementById('role') as HTMLSelectElement).value;

    // Validar que el correo tiene un formato correcto
    const emailPattern = /^[^\s@]+@gmail\.(com|cl)$/;
    if (!emailPattern.test(email)) {
      this.presentToast('El correo electrónico no es válido.', 'danger');
      return;
    }

    try {
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (user) {
        await user.sendEmailVerification();
        const token = await user.getIdToken();

        const userData: AppUser = {
          uid: user.uid,
          fullName,
          rut,
          email,
          phone,
          role,
          createdAt: new Date(),
          token,
        };

        await this.firestore.collection('Usuarios').doc(user.uid).set(userData);

        this.presentToast('Usuario registrado. Por favor verifica tu correo.', 'success');

        // Esperar 2 segundos antes de redirigir
        setTimeout(() => {
          this.router.navigate(['/iniciar-sesion']);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error durante el registro:', error);
      this.presentToast(error.message || 'Ocurrió un error desconocido.', 'danger');
    }
  }

  // Función para mostrar los mensajes de toast
  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 2000, // Reducido a 2 segundos para que la redirección no tarde demasiado
      position: 'top',
    });
    toast.present();
  }

  ngOnInit() {}
}
