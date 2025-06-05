import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-administrar-cotizaciones',
  templateUrl: './administrar-cotizaciones.page.html',
  styleUrls: ['./administrar-cotizaciones.page.scss'],
})
export class AdministrarCotizacionesPage implements OnInit {
  ocs: any[] = [];
  ocsFiltradas: any[] = [];
  busqueda: string = '';

  estadosDisponibles: string[] = [
    'Preaprobado',
    'Aprobado',
    'Rechazado',
    'OC enviada a proveedor',
    'Por Importación'
  ];

  constructor(
    private firestore: AngularFirestore,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.cargarOCs();
  }

cargarOCs() {
  this.firestore.collection('ordenes_oc').snapshotChanges().subscribe(snapshot => {
    this.ocs = snapshot.map(doc => {
      const data = doc.payload.doc.data() as any;
      return {
        docId: doc.payload.doc.id,
        ...data
      };
    }).sort((a, b) => {
      const fechaA = a.fechaSubida?.toDate?.() || new Date(0);
      const fechaB = b.fechaSubida?.toDate?.() || new Date(0);
      return fechaB.getTime() - fechaA.getTime(); // De más reciente a más antigua
    });

    this.filtrarOCs();
  });
}


  filtrarOCs() {
    const b = this.busqueda.toLowerCase();
    this.ocsFiltradas = this.ocs.filter(oc =>
      oc.id?.toString().includes(b) || oc.estatus?.toLowerCase().includes(b)
    );
  }

  async editarEstado(oc: any) {
    const alert = await this.alertController.create({
      header: `Cambiar estatus`,
      inputs: this.estadosDisponibles.map(estado => ({
        type: 'radio',
        label: estado,
        value: estado,
        checked: oc.estatus === estado
      })),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Actualizar',
          handler: async (nuevoEstado) => {
            await this.firestore.collection('ordenes_oc').doc(oc.docId).update({
              estatus: nuevoEstado
            });
            this.cargarOCs();
          }
        }
      ]
    });

    await alert.present();
  }

  async editarId(oc: any) {
    const alert = await this.alertController.create({
      header: 'Modificar ID',
      inputs: [
        {
          name: 'nuevoId',
          type: 'text',
          placeholder: 'Nuevo ID',
          value: oc.id
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data) => {
            await this.firestore.collection('ordenes_oc').doc(oc.docId).update({
              id: data.nuevoId
            });
            this.cargarOCs();
          }
        }
      ]
    });

    await alert.present();
  }

  async eliminarOC(oc: any) {
    const alert = await this.alertController.create({
      header: 'Eliminar OC',
      message: `¿Eliminar OC ID: ${oc.id}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            await this.firestore.collection('ordenes_oc').doc(oc.docId).delete();
            this.cargarOCs();
          }
        }
      ]
    });

    await alert.present();
  }

  getColorByStatus(estatus: string): string {
    switch (estatus) {
      case 'Aprobado': return '#28a745';
      case 'Rechazado': return '#dc3545';
      case 'Preaprobado': return '#ffc107';
      case 'OC enviada a proveedor': return '#17a2b8';
      case 'Por Importación': return '#6f42c1';
      default: return '#6c757d';
    }
  }
}
