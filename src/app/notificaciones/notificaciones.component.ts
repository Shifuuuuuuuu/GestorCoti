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

  constructor(
    private notificacionesService: NotificacionesService,
    private auth: AngularFireAuth,
    private modalCtrl: ModalController
  ) {}

  async ngOnInit() {
    this.ocsPendientes = [...this.notificacionesService.ocsPendientes];
    this.verificarVisibilidad();

    const user = await this.auth.currentUser;
    this.uid = user?.uid || '';
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
}
