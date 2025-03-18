import { Component, OnInit } from '@angular/core';
import { SolpeService } from '../services/solpe.service';
import { AlertController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-gestorsolpes',
  templateUrl: './gestorsolpes.page.html',
  styleUrls: ['./gestorsolpes.page.scss'],
})
export class GestorsolpesPage implements OnInit {
  solpes: any[] = [];

  constructor(
    private solpeService: SolpeService,
    private alertController: AlertController,
    private firestore: AngularFirestore
  ) {}

  ngOnInit() {
    this.cargarSolpes();
  }

  cargarSolpes() {
    this.solpeService.obtenerTodasLasSolpes().subscribe((data: any[]) => {
      this.solpes = data.map((solpe: any) => {
        solpe.items = solpe.items.map((item: any) => ({
          ...item,
          comparaciones: item.comparaciones || [],
        }));
        return solpe;
      });
    });
  }

  async cambiarEstatus(solpe: any) {
    const alert = await this.alertController.create({
      header: 'Cambiar Estado de la SOLPE',
      inputs: [
        { name: 'estatus', type: 'radio', label: 'Aprobado', value: 'Aprobado' },
        { name: 'estatus', type: 'radio', label: 'Rechazado', value: 'Rechazado' },
        { name: 'estatus', type: 'radio', label: 'Tránsito a Faena', value: 'Tránsito a Faena' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Actualizar',
          handler: (estatusSeleccionado) => {
            if (estatusSeleccionado) {
              this.firestore.collection('solpes').doc(solpe.id).update({
                estatus: estatusSeleccionado,
              }).then(() => {
                solpe.estatus = estatusSeleccionado; // Refleja el cambio en la UI
              });
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async abrirComparacion(item: any, solpeId: string) {
    const alert = await this.alertController.create({
      header: 'Agregar Comparación de Precios',
      inputs: [
        { name: 'empresa', type: 'text', placeholder: 'Nombre de la Empresa' },
        { name: 'precio', type: 'number', placeholder: 'Precio' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar',
          handler: (data) => {
            if (data.empresa && data.precio) {
              item.comparaciones.push({ empresa: data.empresa, precio: Number(data.precio) });
              this.guardarComparacion(item, solpeId);
            }
          },
        },
      ],
    });
    await alert.present();
  }

  guardarComparacion(item: any, solpeId: string) {
    const solpeRef = this.firestore.collection('solpes').doc(solpeId);
    const itemRef = solpeRef.collection('items').doc(item.id);

    itemRef.update({ comparaciones: item.comparaciones });
  }

  subirComparaciones(item: any, solpe: any) {
    const solpeRef = this.firestore.collection('solpes').doc(solpe.id);
    const updatedItems = solpe.items.map((it: any) => {
      if (it.item === item.item) {
        return { ...it, comparaciones: item.comparaciones };
      }
      return it;
    });

    solpeRef.update({
      items: updatedItems
    }).then(() => {
      console.log('Comparaciones actualizadas en Firestore');
    }).catch(err => {
      console.error('Error al subir comparaciones:', err);
    });
  }
}
