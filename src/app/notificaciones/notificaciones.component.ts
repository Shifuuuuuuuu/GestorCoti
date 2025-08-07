import { Component, OnInit } from '@angular/core';
import { NotificacionesService } from '../services/notificaciones.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-notificaciones',
  templateUrl: './notificaciones.component.html',
  styleUrls: ['./notificaciones.component.scss'],
})
export class NotificacionesComponent  implements OnInit {
  ocsPendientes: any[] = [];
  mostrarCard: boolean = true;
  uid: string = '';
  nombreUsuario: string = '';
  constructor(
    private notificacionesService: NotificacionesService,
    private auth: AngularFireAuth,
    private modalCtrl: ModalController,
    private firestore: AngularFirestore
  ) {}

async ngOnInit() {
  const user = await this.auth.currentUser;
  this.uid = user?.uid || '';
  if (!this.uid) return;

  const userDoc = await this.firestore.collection('Usuarios').doc(this.uid).get().toPromise();
  const userData = userDoc?.data() as { fullName?: string } || {};
  this.nombreUsuario = userData.fullName || '';

  // Obtener notificaciones personalizadas: cotizador y creador de SOLPED
  this.ocsPendientes = await this.notificacionesService.obtenerNotificacionesPersonalizadas(this.nombreUsuario, this.uid);
  this.verificarVisibilidad();
}



  formatearFecha(fecha: any): string {
    const date = fecha?.toDate?.() || new Date(fecha);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  async eliminarNotificacion(index: number) {
    const oc = this.ocsPendientes[index];
    this.ocsPendientes.splice(index, 1);

    if (this.uid && oc?.id) {
      await this.notificacionesService.marcarOCComoVista(this.uid, oc.id);
    }

    this.verificarVisibilidad();
  }

  cerrar() {
    this.modalCtrl.dismiss(); // Solo cierra el modal sin marcar como vistas
  }

  verificarVisibilidad() {
    this.mostrarCard = this.ocsPendientes.length > 0;
  }

  verPDF(oc: any) {
    const pdf = oc.archivosStorage?.find(
      (archivo: any) => archivo.tipo === 'application/pdf'
    );
    if (pdf?.url) {
      window.open(pdf.url, '_blank');
    } else {
      alert('⚠️ No se encontró un PDF en esta OC.');
    }
  }
    obtenerTipoNotificacion(oc: any): string {
    if (oc?.responsable === this.nombreUsuario) {
      return 'Cotizador';
    } else if (oc?.tipoNotificacion === 'solped') {
      return 'Autor SOLPED';
    }
    return 'Otro';
  }
}
