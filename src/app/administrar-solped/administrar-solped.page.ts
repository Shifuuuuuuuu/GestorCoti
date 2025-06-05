import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-administrar-solped',
  templateUrl: './administrar-solped.page.html',
  styleUrls: ['./administrar-solped.page.scss'],
})
export class AdministrarSolpedPage implements OnInit {
  solpeds: any[] = [];
  solpedFiltrados: any[] = [];
  mostrarFiltros: boolean = false;
  busqueda: string = '';
  filtroCentro: string = '';
  filtroResponsable: string = '';

  responsables: string[] = [];

  estadosDisponibles: string[] = [
    'Solicitado',
    'Preaprobado',
    'Aprobado',
    'Rechazado',
    'Tránsito a Faena',
    'OC enviada a proveedor',
    'Por Importación'
  ];

  constructor(
    private firestore: AngularFirestore,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.cargarSolpeds();
  }

  cargarSolpeds() {
    this.firestore.collection('solpes').snapshotChanges().subscribe(snapshot => {
      this.solpeds = snapshot.map(doc => {
        const data = doc.payload.doc.data() as any;
        return {
          id: doc.payload.doc.id,
          ...data
        };
      });

      this.responsables = [...new Set(this.solpeds.map(s => s.usuario).filter(r => !!r))];
      this.filtrarSolpeds();
    });
  }

  filtrarSolpeds() {
    this.solpedFiltrados = this.solpeds.filter(s => {
      const coincideBusqueda =
        s.numero_solpe?.toString().includes(this.busqueda) ||
        s.usuario?.toLowerCase().includes(this.busqueda.toLowerCase());

      const coincideCentro = !this.filtroCentro || s.numero_contrato === this.filtroCentro;
      const coincideResponsable = !this.filtroResponsable || s.usuario === this.filtroResponsable;

      return coincideBusqueda && coincideCentro && coincideResponsable;
    });
  }

  async editarSolped(solped: any) {
    const alert = await this.alertController.create({
      header: `Cambiar estatus - SOLPED #${solped.numero_solpe}`,
      inputs: this.estadosDisponibles.map(estado => ({
        type: 'radio',
        label: estado,
        value: estado,
        checked: solped.estatus === estado
      })),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Actualizar',
          handler: async (nuevoEstado) => {
            await this.firestore.collection('solpes').doc(solped.id).update({
              estatus: nuevoEstado
            });
            this.cargarSolpeds();
          }
        }
      ]
    });

    await alert.present();
  }

  async eliminarSolped(solped: any) {
    const alerta = await this.alertController.create({
      header: 'Eliminar',
      message: `¿Deseas eliminar la SOLPED #${solped.numero_solpe}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            await this.firestore.collection('solpes').doc(solped.id).delete();
            this.cargarSolpeds();
          }
        }
      ]
    });
    await alerta.present();
  }

  getColorByStatus(estatus: string): string {
    switch (estatus) {
      case 'Aprobado': return '#28a745';
      case 'Rechazado': return '#dc3545';
      case 'Solicitado': return '#fd7e14';
      case 'Tránsito a Faena': return '#007bff';
      case 'Preaprobado': return '#ffc107';
      case 'OC enviada a proveedor': return '#17a2b8';
      case 'Por Importación': return '#6f42c1';
      default: return '#6c757d';
    }
  }
}
