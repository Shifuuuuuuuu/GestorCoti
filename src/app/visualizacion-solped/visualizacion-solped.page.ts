import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertController } from '@ionic/angular';
import { SolpeService } from '../services/solpe.service';
import { Solpes } from '../Interface/ISolpes';
import { Comparacion } from '../Interface/IComparacion';
import { Comparaciones } from '../Interface/Icompara';

@Component({
  selector: 'app-visualizacion-solped',
  templateUrl: './visualizacion-solped.page.html',
  styleUrls: ['./visualizacion-solped.page.scss'],
})
export class VisualizacionSolpedPage implements OnInit {
  solpedList: any[] = [];
  loading: boolean = true;

  constructor(
    private firestore: AngularFirestore,
    private alertCtrl: AlertController,
    private solpeService: SolpeService
  ) {}

  ngOnInit() {
    // Simula carga de datos mientras se muestra un skeleton
    setTimeout(() => {
      this.cargarSolped();
      this.loading = false;
    }, 2000);
  }

  cargarSolped() {
    this.solpeService.obtenerTodasLasSolpes().subscribe((data: any[]) => {
      // Filtrar solo las SOLPEDs con estatus 'Solicitado'
      const filtradas = data.filter(solpe => solpe.estatus === 'Solicitado');

      // Mapeo para asegurar estructura de items y comparaciones
      this.solpedList = filtradas.map((solpe: any) => {
        solpe.items = solpe.items
          ? solpe.items.map((item: any) => ({
              ...item,
              comparaciones: item.comparaciones || [],
            }))
          : [];
        return solpe;
      });

      console.log('✅ SOLPEDS CARGADAS (solo Solicitadas):', this.solpedList);
    });
  }

  aprobarSolped(solped: any) {
    this.actualizarEstado(solped.id, 'Aprobado', solped.comentario);
  }

  rechazarSolped(solped: any) {
    this.actualizarEstado(solped.id, 'Rechazado', solped.comentario);
  }

  async actualizarEstado(id: string, estado: string, comentario: string) {
    try {
      await this.firestore.collection('solpes').doc(id).update({
        estatus: estado,
        comentario: comentario,
      });

      const alert = await this.alertCtrl.create({
        header: 'Éxito',
        message: `SOLPED ${estado}`,
        buttons: ['OK'],
      });
      await alert.present();

      this.cargarSolped(); // Refresca la lista filtrada
    } catch (error) {
      console.error('Error al actualizar:', error);
      const errorAlert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Hubo un problema al actualizar el estado.',
        buttons: ['OK'],
      });
      await errorAlert.present();
    }
  }

  async eliminarComparacion(solpedId: string, itemId: string, comparacionId: number) {
    const solpedRef = this.firestore.collection('solpes').doc(solpedId);

    try {
      const solpedDoc = await solpedRef.get().toPromise();

      if (solpedDoc && solpedDoc.exists) {
        const solpedData = solpedDoc.data() as Solpes;
        const items = solpedData?.items || [];

        const item = items.find(i => i.id === itemId);
        if (item) {
          const comparacionIndex = item.comparaciones.findIndex(
            (comp: Comparaciones) => comp.id === comparacionId
          );

          if (comparacionIndex !== -1) {
            // Elimina la comparación
            item.comparaciones.splice(comparacionIndex, 1);

            // Actualiza en Firestore
            await solpedRef.update({ items });
            console.log('✅ Comparación eliminada correctamente');
          } else {
            console.log('❌ Comparación no encontrada');
          }
        } else {
          console.log('❌ Ítem no encontrado');
        }
      } else {
        console.log('❌ Documento no encontrado o vacío');
      }
    } catch (error) {
      console.error('Error eliminando la comparación:', error);
    }
  }
}

