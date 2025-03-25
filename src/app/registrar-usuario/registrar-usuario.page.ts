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

  async register(event?: Event) {
    if (event) event.preventDefault(); // Prevenir envío automático del form

    const fullName = (document.getElementById('fullName') as HTMLInputElement).value.trim();
    let rut = (document.getElementById('rut') as HTMLInputElement).value.trim();
    const email = (document.getElementById('email') as HTMLInputElement).value.trim();
    let phone = (document.getElementById('phone') as HTMLInputElement).value.trim();
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const role = (document.getElementById('role') as HTMLSelectElement).value;

    // ✅ Validación de dominio xtrememining.cl
    const emailPattern = /^[a-zA-Z0-9._%+-]+@xtrememining\.cl$/;
    if (!emailPattern.test(email)) {
      this.presentToast('El correo debe ser del dominio @xtrememining.cl', 'danger');
      return;
    }

    // ✅ Validación de contraseña segura y restricción de 10 caracteres
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{5,10}$/;
    if (!passwordPattern.test(password)) {
      this.presentToast('La contraseña debe tener entre 5 y 10 caracteres, con 1 mayúscula, 1 número y 1 caracter especial.', 'danger');
      return;
    }

    // ✅ Formateo de RUT tipo "21-098-143-8"
    rut = this.formatRUTForSave(rut);

    // ✅ Formateo de teléfono tipo "+56948096007"
    phone = this.formatPhoneForSave(phone);

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

        setTimeout(() => {
          this.router.navigate(['/iniciar-sesion']);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error durante el registro:', error);
      this.presentToast(error.message || 'Ocurrió un error desconocido.', 'danger');
    }
  }

  // ✅ Función para formatear el RUT antes de guardar
  formatRUTForSave(rut: string): string {
    const cleanRut = rut.replace(/\D/g, ''); // Solo números
    return `${cleanRut.slice(0, 2)}-${cleanRut.slice(2, 5)}-${cleanRut.slice(5, 8)}-${cleanRut.slice(8)}`;
  }

  // ✅ Función para formatear el teléfono antes de guardar
  formatPhoneForSave(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, ''); // Solo números
    return `+56${cleanPhone}`;
  }

  // ✅ Validación visual en input si quieres formatear mientras escribe (opcional)
  formatRUT(event: any) {
    let input = event.target.value.replace(/\D/g, '');
    if (input.length > 8) {
      input = input.substring(0, 8) + '-' + input.substring(8);
    }
    let rutFormateado = '';
    if (input.length > 1) {
      rutFormateado = input.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '' + input.slice(-1);
    } else {
      rutFormateado = input;
    }
    event.target.value = rutFormateado;
  }

  formatPhone(event: any) {
    event.target.value = event.target.value.replace(/\D/g, '').substring(0, 8);
  }

  // ✅ Toasts
  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 2000,
      position: 'top',
    });
    toast.present();
  }

  ngOnInit() {}
}
