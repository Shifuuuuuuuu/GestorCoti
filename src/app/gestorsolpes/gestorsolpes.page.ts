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
    // Simula la carga de la API o base de datos
    setTimeout(() => {
      // Aquí llenas la lista real
      this.cargarSolpes();
      this.loading = false;
    }, 2000); // 2 segundos de skeleton
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
              // Asignar un ID único a la comparación
              const nuevoId = Date.now(); // Puedes usar un contador incremental si lo prefieres
              item.comparaciones.push({
                id: nuevoId,  // Asignar ID único
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

  // Ahora este método sube las comparaciones de todos los ítems de la SOLPE
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
