import { Component, Input, OnInit } from '@angular/core';
import { Mensaje } from '../Interface/IMessage';
import { AuthService } from '../services/auth.service';
import { ChatService } from '../services/chat.service';
import { ModalController, NavController } from '@ionic/angular';
import { AppUser } from '../Interface/IUser';

@Component({
  selector: 'app-chat-modal',
  templateUrl: './chat-modal.component.html',
  styleUrls: ['./chat-modal.component.scss'],
})
export class ChatModalComponent  implements OnInit {
  usuarios: AppUser[] = [];
  chatActivo: boolean = false;
  escribiendo: boolean = false;
  receptorId: string = '';
  mensajes: Mensaje[] = [];
  mensaje: string = '';
  remitente: AppUser | null = null;

  private escribiendoTimeout: any;

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private navController: NavController,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.obtenerUsuarios(userId);
    } else {
      console.log('Usuario no autenticado');
    }


    this.cargarMensajes();
  }

  onInput() {
    this.escribiendo = true;
    clearTimeout(this.escribiendoTimeout);
    this.escribiendoTimeout = setTimeout(() => {
      this.escribiendo = false;
    }, 3000);
  }

  cerrarChat() {
    this.chatActivo = false;
    this.mensajes = [];
    this.navController.pop();
  }

    cerrarMod() {
      this.modalController.dismiss();
    }


  enviarMensaje() {
    if (!this.remitente || !this.receptorId) {
      return;
    }

    if (!this.mensaje.trim()) {

      return;
    }

    this.chatService.enviarMensaje(this.remitente!.uid, this.receptorId, this.mensaje).then(() => {
      const nuevoMensaje = {
        remitenteId: this.remitente!.uid,
        receptorId: this.receptorId,
        mensaje: this.mensaje.replace(/:/g, ''),
        nombreRemitente: this.remitente!.displayName || this.remitente!.email,
        timestamp: new Date(),
        visto: false
      };
      this.mensajes.push(nuevoMensaje);
      this.mensaje = '';
    }).catch(error => {
      console.error('Error al enviar el mensaje:', error);
    });
  }

  cargarMensajes() {
    if (this.remitente) {
      this.chatService.obtenerMensajes(this.remitente.uid, this.receptorId).subscribe((mensajes) => {
        const mensajesProcesados = mensajes.map((change: any) => {
          const mensaje = change.payload.doc.data();


          if (mensaje.timestamp && mensaje.timestamp.seconds) {
            mensaje.timestamp = new Date(mensaje.timestamp.seconds * 1000);
          }

          mensaje.mensaje = mensaje.mensaje.replace(/:/g, '');


          if (mensaje.receptorId === this.remitente?.uid && !mensaje.visto) {
            this.chatService.marcarMensajeVisto(change.payload.doc.id);
            mensaje.visto = true;
          }

          return mensaje;
        });

        this.mensajes = mensajesProcesados;
      });
    }
  }


  obtenerNombreRemitente(remitenteId: string): string {
    const usuario = this.usuarios.find(u => u.uid === remitenteId);
    return usuario?.displayName ?? 'Desconocido';
  }


  obtenerNombreReceptor(): string {
    const usuario = this.usuarios.find((user) => user.uid === this.receptorId);
    return usuario ? usuario.displayName || usuario.email : 'Desconocido';
  }


  obtenerUsuarios(userId: string) {
    this.authService.obtenerUsuarios().subscribe((usuarios) => {
      this.usuarios = usuarios;


      const usuarioAutenticado = this.usuarios.find((usuario) => usuario.uid === userId);
      if (usuarioAutenticado) {
        this.remitente = usuarioAutenticado;

        this.cargarMensajes();
      } else {
        console.log('Usuario autenticado no encontrado en la lista');
      }
    });
  }


  seleccionarUsuario(usuario: AppUser) {
    this.receptorId = usuario.uid;
    this.chatActivo = true;
    this.cargarMensajes();
    console.log('Receptor seleccionado:', this.receptorId);
  }



  volverALista() {
    this.chatActivo = false;
    this.receptorId = '';
    this.mensajes = [];
  }
}
