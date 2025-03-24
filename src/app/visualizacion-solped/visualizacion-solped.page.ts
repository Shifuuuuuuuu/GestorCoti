import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertController } from '@ionic/angular';
import { SolpeService } from '../services/solpe.service';

@Component({
  selector: 'app-visualizacion-solped',
  templateUrl: './visualizacion-solped.page.html',
  styleUrls: ['./visualizacion-solped.page.scss'],
})
export class VisualizacionSolpedPage implements OnInit {
  solpedList: any[] = [];

  constructor(private firestore: AngularFirestore, private alertCtrl: AlertController, private solpeService: SolpeService) {}

  ngOnInit() {
    this.cargarSolped();
  }

  cargarSolped() {
    this.solpeService.obtenerTodasLasSolpes().subscribe((data: any[]) => {
      // Mapeo de los solpes
      this.solpedList = data.map((solpe: any) => {
        // Aseguramos que cada solpe tenga una propiedad 'items', incluso si está vacía
        solpe.items = solpe.items ? solpe.items.map((item: any) => ({
          ...item,
          comparaciones: item.comparaciones || [], // Si no hay comparaciones, inicializamos como un array vacío
        })) : [];

        return solpe;
      });

      console.log('✅ SOLPEDS CARGADAS:', this.solpedList);
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
        comentario: comentario
      });

      const alert = await this.alertCtrl.create({
        header: 'Éxito',
        message: `SOLPED ${estado}`,
        buttons: ['OK']
      });
      await alert.present();

      this.cargarSolped(); // Recarga la lista actualizada
    } catch (error) {
      console.error('Error al actualizar:', error);
    }
  }
}

