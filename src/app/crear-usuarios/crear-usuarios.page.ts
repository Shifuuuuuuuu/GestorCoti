import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-crear-usuarios',
  templateUrl: './crear-usuarios.page.html',
  styleUrls: ['./crear-usuarios.page.scss'],
})
export class CrearUsuariosPage {
  usuario: any = {
    email: '',
    password: '',
    fullName: '',
    phone: '',
    rut: '',
    role: ''
  };
  usuarios: any[] = [];
  editando: boolean = false;
  uidEditando: string = '';
  mostrarFormulario = false;
  cargandoUsuarios = true;

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    this.cargandoUsuarios = true;
    this.firestore.collection('Usuarios').valueChanges({ idField: 'id' }).subscribe(
      data => {
        this.usuarios = data;
        this.cargandoUsuarios = false;
      },
      err => {
        console.error('Error al cargar usuarios', err);
        this.cargandoUsuarios = false;
      }
    );
  }

  limpiarFormulario() {
    this.usuario = {
      email: '',
      password: '',
      fullName: '',
      phone: '',
      rut: '',
      role: ''
    };
  }

  async crearUsuario() {
    const loading = await this.loadingCtrl.create({ message: this.editando ? 'Actualizando...' : 'Creando usuario...' });
    await loading.present();

    try {
      if (this.editando) {
        await this.firestore.collection('Usuarios').doc(this.uidEditando).update({
          fullName: this.usuario.fullName,
          phone: this.usuario.phone,
          rut: this.usuario.rut,
          role: this.usuario.role
        });
        this.editando = false;
        this.uidEditando = '';
      } else {
        const cred = await this.afAuth.createUserWithEmailAndPassword(this.usuario.email, this.usuario.password);
        const uid = cred.user?.uid;
        if (uid) {
          await this.firestore.collection('Usuarios').doc(uid).set({
            email: this.usuario.email,
            fullName: this.usuario.fullName,
            phone: this.usuario.phone,
            rut: this.usuario.rut,
            role: this.usuario.role,
            createdAt: new Date(),
            uid: uid
          });
        }
      }

      loading.dismiss();
      this.limpiarFormulario();
      this.mostrarFormulario = false;
      const alert = await this.alertCtrl.create({
        header: 'Éxito',
        message: this.editando ? 'Usuario actualizado correctamente.' : 'Usuario creado exitosamente.',
        buttons: ['OK']
      });
      await alert.present();

    } catch (error: unknown) {
      loading.dismiss();
      let errorMessage = 'Ocurrió un error.';
      if (error instanceof Error) errorMessage = error.message;
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: errorMessage,
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  editarUsuario(user: any) {
    this.editando = true;
    this.mostrarFormulario = true;
    this.uidEditando = user.id;
    this.usuario = {
      email: user.email,
      password: '',
      fullName: user.fullName,
      phone: user.phone,
      rut: user.rut,
      role: user.role
    };
  }

  async eliminarUsuario(user: any) {
    const confirm = await this.alertCtrl.create({
      header: '¿Eliminar?',
      message: `¿Deseas eliminar a ${user.fullName}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            await this.firestore.collection('Usuarios').doc(user.id).delete();
          }
        }
      ]
    });
    await confirm.present();
  }
}
