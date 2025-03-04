import { Component, OnInit } from '@angular/core';
import { Mensaje } from '../Interface/IMessage';
import { ChatService } from '../services/chat.service';
import { AuthService } from '../services/auth.service';
import { AppUser } from '../Interface/IUser';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit {
  usuarios: AppUser[] = [];
  chatActivo: boolean = false;
  escribiendo: boolean = false; // Para mostrar el indicador de escritura
  receptorId: string = ''; // ID del receptor seleccionado
  mensajes: Mensaje[] = []; // Aquí deberías tener la lista de mensajes
  mensaje: string = '';
  remitente: AppUser| null = null; // Remitente será el usuario autenticado

  private escribiendoTimeout: any; // Para controlar el timeout del "escribiendo"

  constructor(
    private authService: AuthService,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    // Obtener el ID del usuario desde localStorage
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.obtenerUsuarios(userId); // Pasamos el userId para obtener el remitente
    } else {
      console.log('Usuario no autenticado');
    }

    // Cargar los mensajes y manejar la animación de "escribiendo"
    this.cargarMensajes();
  }

  // Detecta cuando el usuario empieza a escribir
  onInput() {
    this.escribiendo = true;
    clearTimeout(this.escribiendoTimeout); // Limpiar cualquier timeout previo

    // Después de 3 segundos de inactividad, se desactiva el indicador de "escribiendo"
    this.escribiendoTimeout = setTimeout(() => {
      this.escribiendo = false;
    }, 3000); // 3 segundos de inactividad
  }

  // Método para enviar el mensaje
  enviarMensaje() {
    if (!this.mensaje.trim()) return; // Evitar enviar mensajes vacíos

    this.chatService.enviarMensaje(this.remitente!.uid, this.receptorId, this.mensaje).then(() => {
      // Agregar el mensaje localmente solo después de enviarlo
      const nuevoMensaje = {
        remitenteId: this.remitente!.uid,
        receptorId: this.receptorId,
        mensaje: this.mensaje.replace(/:/g, ''), // Eliminar los dos puntos del mensaje
        nombreRemitente: this.remitente!.displayName || this.remitente!.email, // Nombre del remitente
        timestamp: new Date(),
        visto: false // Establecer como no visto inicialmente
      };
      this.mensajes.push(nuevoMensaje);
      this.mensaje = ''; // Limpiar el campo de entrada
    }).catch(error => {
      console.error('Error al enviar el mensaje:', error);
    });
  }

  // Método para cargar los mensajes
  cargarMensajes() {
    if (this.remitente) {
      this.chatService.obtenerMensajes(this.remitente.uid, this.receptorId).subscribe((mensajes) => {
        const mensajesProcesados = mensajes.map((change: any) => {
          const mensaje = change.payload.doc.data();

          // Convertir el Timestamp en un objeto Date
          if (mensaje.timestamp && mensaje.timestamp.seconds) {
            mensaje.timestamp = new Date(mensaje.timestamp.seconds * 1000); // Convertir a milisegundos
          }

          mensaje.mensaje = mensaje.mensaje.replace(/:/g, '');

          // Marcar los mensajes como vistos si el receptor ha visto el chat
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

  // Método para obtener el nombre del remitente
  obtenerNombreRemitente(remitenteId: string): string {
    const usuario = this.usuarios.find(u => u.uid === remitenteId);
    return usuario?.displayName ?? 'Desconocido';
  }

  // Método para obtener el nombre del receptor
  obtenerNombreReceptor(): string {
    const usuario = this.usuarios.find((user) => user.uid === this.receptorId);
    return usuario ? usuario.displayName || usuario.email : 'Desconocido';
  }

  // Método para obtener la lista de usuarios y asignar el remitente
  obtenerUsuarios(userId: string) {
    this.authService.obtenerUsuarios().subscribe((usuarios) => {
      this.usuarios = usuarios;
      console.log('Usuarios obtenidos:', this.usuarios);

      const usuarioAutenticado = this.usuarios.find(
        (usuario) => usuario.uid === userId
      );
      if (usuarioAutenticado) {
        this.remitente = usuarioAutenticado;
        this.cargarMensajes();
      } else {
        console.log('Usuario autenticado no encontrado en la lista');
      }
    });
  }

  // Método para seleccionar un usuario para chatear
  seleccionarUsuario(usuario: AppUser) {
    this.receptorId = usuario.uid;
    this.chatActivo = true;
    this.cargarMensajes();
  }

  // Método para volver a la lista de usuarios
  volverALista() {
    this.chatActivo = false;
    this.receptorId = '';
    this.mensajes = [];
  }
}
