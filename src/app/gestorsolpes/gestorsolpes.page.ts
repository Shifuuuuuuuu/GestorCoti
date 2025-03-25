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
  loading: boolean = true;
  solpesFiltradas: any[] = [];

  constructor(
    private solpeService: SolpeService,
    private alertController: AlertController,
    private firestore: AngularFirestore
  ) {}

  ngOnInit() {
    setTimeout(() => {
      this.cargarSolpes();
      this.loading = false;
    }, 2000);
  }

  cargarSolpes() {
    this.solpeService.obtenerTodasLasSolpes().subscribe((data: any[]) => {
      const filtradas = data.filter(solpe => solpe.estatus === 'Solicitada');
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
          text: 'Siguiente',
          handler: async (estatusSeleccionado) => {
            if (estatusSeleccionado) {
              const commentAlert = await this.alertController.create({
                header: 'Agregar Comentario',
                inputs: [
                  { name: 'comentario', type: 'text', placeholder: 'Escribe un comentario' }
                ],
                buttons: [
                  { text: 'Cancelar', role: 'cancel' },
                  {
                    text: 'Guardar',
                    handler: (data) => {
                      this.firestore.collection('solpes').doc(solpe.id).update({
                        estatus: estatusSeleccionado,
                        comentario: data.comentario || ''
                      }).then(() => {
                        solpe.estatus = estatusSeleccionado;
                        solpe.comentario = data.comentario || '';
                      });
                    }
                  }
                ]
              });
              await commentAlert.present();
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
            }).then(() => {
              console.log('Comparaciones subidas a Firestore');
            }).catch(err => {
              console.error('Error al subir comparaciones:', err);
            });
          }
        }
      ]
    });
    await confirm.present();
  }
}
