import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MenuController, ToastController } from '@ionic/angular';
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
    private router: Router,
    private menu: MenuController
  ) {}

async register(event?: Event) {
  if (event) event.preventDefault();

  const fullName = (document.getElementById('fullName') as HTMLInputElement).value.trim();
  let rut = (document.getElementById('rut') as HTMLInputElement).value.trim();
  const email = (document.getElementById('email') as HTMLInputElement).value.trim();
  let phone = (document.getElementById('phone') as HTMLInputElement).value.trim();
  const password = (document.getElementById('password') as HTMLInputElement).value;
  const role = (document.getElementById('role') as HTMLSelectElement).value;

  const correosPermitidos = [
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
    'pbustos@xtrememining.cl',
    'ahernandez@xtrememining.cl',
    'dlizama@mining.cl',
    'dlizama@xtrememining.cl',
    'cpalma@xtrememining.cl',
    'mballesteros@xtrememining.cl',
    'mviveros14705@xtrememining.cl',
    'eopazo@xtrememining.cl',
    'bodega.cs650@xtrememining.cl',
    'acontreras@xtrememining.cl',
    'rgonzalez@xtrememining.cl',
    'aleiva@xtrememining.cl',
    'jdonoso@xtrememining.cl',
    'jcancino.a@xtrememining.cl',
    'aalbornoz@xtremehormigones.cl',
    'vhermosilla@xtremehormigones.cl',
    'nyanez@xtremehormigones.cl',
    'msilva@xtremehormigones.cl',
    'fgonzalez.dand@xtrememining.cl',
    'ccastro@xtrememining.cl',
    'dholz@xtrememining.cl',
    'brubio@xtrememining.cl',
    'Ebastidas@xtrememining.cl',
    'gmatus@xtrememining.cl',
    'acp@xtrememining.cl',
    'cmolina@xtrememining.cl',
    'fgonzalez@xtrememining.cl',
    'rsantibanez@xtrememining.cl',
    'pmunoz@xtrememining.cl',

    'fhidalgo@xtrememining.cl',
    'aalbornoz@xtremehormigones.cl',
    'vhermosilla@xtremehormigones.cl',
    'cmolina@xtrememining.cl',
    'jvallejos@xtrememining.cl',
    'jpantoja20915@xtrememining.cl',
    'ccastro@xtrememining.cl',
    'srios@xtrememining.cl',

    'fcornejo@xtrememining.cl',
    'elobos@xtrememining.cl',
    'lsalinas@xtrememining.cl',
    'yvasquez@xtrememining.cl',
    'jlopez@xtrememining.cl',
    'rroman@xtrememining.cl',
    'jvillarroel@xtrememining.cl',
    'crag78@gmail.com',
    'cristianpichonhernandez28@gmail.com',
    'jbenitez@xtremehormigones.cl',

    'bmiranda@xtrememining.cl',
    'rveas@xtrememining.cl',
    'gneculeman@xtrememining.cl',
    'nfuentes@xtrememining.cl',
    'jarrano@xtrememining.cl',

  ].map(c => c.trim().toLowerCase());

  const emailLimpio = email.trim().toLowerCase();
  const estaPermitido = correosPermitidos.includes(emailLimpio);

  console.log('🧪 Correo ingresado:', `"${emailLimpio}"`);
  console.log('🧪 ¿Está permitido?', estaPermitido);

  if (!estaPermitido) {
    this.presentToast('Este correo no está autorizado para registrarse.', 'danger');
    // Debug detallado
    correosPermitidos.forEach(correo => {
      console.log(`Comparando "${correo}" === "${emailLimpio}":`, correo === emailLimpio);
    });
    return;
  }

  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{5,12}$/;
  if (!passwordPattern.test(password)) {
    this.presentToast('La contraseña debe tener entre 5 y 10 caracteres, con 1 mayúscula, 1 número y 1 caracter especial.', 'danger');
    return;
  }

  if (!email || !password) {
    this.presentToast('Por favor ingresa un correo y una contraseña válidos.', 'danger');
    return;
  }

  rut = this.formatRUTForSave(rut);
  phone = this.formatPhoneForSave(phone);

  try {
    const existingMethods = await this.afAuth.fetchSignInMethodsForEmail(emailLimpio);
    if (existingMethods.length > 0) {
      this.presentToast('Este correo ya está registrado. Intenta iniciar sesión o restablecer tu contraseña.', 'danger');
      return;
    }

    const userCredential = await this.afAuth.createUserWithEmailAndPassword(emailLimpio, password);
    const user = userCredential.user;

    if (user) {
      await user.sendEmailVerification();
      const token = await user.getIdToken();

      const userData: AppUser = {
        uid: user.uid,
        fullName,
        rut,
        email: emailLimpio,
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
    console.error('❌ Error durante el registro:', error);

    if (error.code === 'auth/email-already-in-use') {
      this.presentToast('Este correo ya está registrado. Intenta iniciar sesión o usar otro.', 'danger');
    } else {
      this.presentToast(error.message || 'Ocurrió un error desconocido.', 'danger');
    }
  }
}


  formatRUTForSave(rut: string): string {
    const cleanRut = rut.replace(/\D/g, '');
    return `${cleanRut.slice(0, 2)}.${cleanRut.slice(2, 5)}.${cleanRut.slice(5, 8)}-${cleanRut.slice(8)}`;
  }

  formatPhoneForSave(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    return `+56${cleanPhone}`;
  }

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

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 2000,
      position: 'top',
    });
    toast.present();
  }

  ionViewWillEnter() {
    this.menu.enable(false);
  }

  ngOnInit() {}
}
