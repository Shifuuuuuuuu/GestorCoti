import { Component, OnInit } from '@angular/core';
import { SolpeService } from '../services/solpe.service';
import { AlertController, ToastController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-gestorsolpes',
  templateUrl: './gestorsolpes.page.html',
  styleUrls: ['./gestorsolpes.page.scss'],
})
export class GestorsolpesPage implements OnInit {
  solpes: any[] = [];
  loading: boolean = true;
  solpesFiltradas: any[] = [];

  constructor(
    private solpeService: SolpeService,
    private alertController: AlertController,
    private firestore: AngularFirestore,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    setTimeout(() => {
      this.cargarSolpes();
      this.loading = false;
    }, 2000);
  }

  cargarSolpes() {
    this.solpeService.obtenerTodasLasSolpes().subscribe((data: any[]) => {
      const filtradas = data.filter(solpe => solpe.estatus === 'Solicitado');
      this.solpes = filtradas.map((solpe: any) => {
        solpe.items = solpe.items.map((item: any) => ({
          ...item,
          comparaciones: item.comparaciones || [],
        }));
        return solpe;
      });
    });
  }

  async cambiarEstatus(solpe: any) {
    if (!this.validarComparaciones(solpe)) {
      await this.mostrarToast('Todos los ítems deben tener al menos una comparación de precios', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Cambiar Estado de la SOLPE',
      inputs: [
        { name: 'estatus', type: 'radio', label: 'Pre Aprobado', value: 'Pre Aprobado' },
        { name: 'estatus', type: 'radio', label: 'Tránsito a Faena', value: 'Rechazado' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Siguiente',
          handler: async (estatusSeleccionado) => {
            if (estatusSeleccionado) {
              this.firestore.collection('solpes').doc(solpe.id).update({
                estatus: estatusSeleccionado,
              }).then(() => {
                solpe.estatus = estatusSeleccionado;
              });
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async abrirComparacion(item: any) {
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

              const nuevoId = Date.now();
              item.comparaciones.push({
                id: nuevoId,
                empresa: data.empresa,
                precio: Number(data.precio)
              });
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

  eliminarComparacion(item: any, index: number) {
    item.comparaciones.splice(index, 1);
  }
  destacarComparacion(item: any, index: number) {
    item.comparaciones[index].destacado = !item.comparaciones[index].destacado;
    const solpeRef = this.firestore.collection('solpes').doc(item.solpeId);
    solpeRef.update({
      items: item.comparaciones
    }).then(() => {
      console.log('Comparación actualizada en Firestore');
    }).catch(err => {
      console.error('Error al actualizar comparación:', err);
    });
  }

  async subirComparaciones(solpe: any) {
    const confirm = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Estás seguro de subir las comparaciones a Firestore?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sí, subir',
          handler: () => {
            this.firestore.collection('solpes').doc(solpe.id).update({
              items: solpe.items
            }).then(async () => {
              console.log('Comparaciones subidas a Firestore');
              await this.mostrarToast('Comparaciones subidas con éxito', 'success');
            }).catch(async err => {
              console.error('Error al subir comparaciones:', err);
              await this.mostrarToast('Error al subir comparaciones', 'danger');
            });
          }
        }
      ]
    });
    await confirm.present();
  }
  validarComparaciones(solpe: any): boolean {
    return solpe.items.every((item: any) => item.comparaciones && item.comparaciones.length > 0);
  }

  async mostrarToast(mensaje: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      color: color,
      position: 'top'
    });
    toast.present();
  }
}
