import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertController } from '@ionic/angular';
import { SolpeService } from '../services/solpe.service';
import { Solpes } from '../Interface/ISolpes';
import { Comparaciones } from '../Interface/Icompara';

@Component({
  selector: 'app-visualizacion-solped',
  templateUrl: './visualizacion-solped.page.html',
  styleUrls: ['./visualizacion-solped.page.scss'],
})
export class VisualizacionSolpedPage implements OnInit {
  solpedList: any[] = [];
  loading: boolean = true;
  selectedItem: any = null;
  itemsGuardados: any[] = [];
  solpedSeleccionadaId: string = '';
  mostrarItems = false;

  constructor(
    private firestore: AngularFirestore,
    private alertCtrl: AlertController,
    private solpeService: SolpeService
  ) {}

  ngOnInit() {
    setTimeout(() => {
      this.cargarSolped();
      this.loading = false;
    }, 2000);
    this.obtenerItemsGuardados();
  }
  async agregarItemASolped() {
    if (!this.solpedSeleccionadaId || !this.selectedItem) {
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Debes seleccionar una SOLPED y un ítem para poder continuar.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    try {
      const solpedRef = this.firestore.collection('solpes').doc(this.solpedSeleccionadaId);
      const solpedDoc = await solpedRef.get().toPromise();

      if (solpedDoc?.exists) {
        const solpedData = solpedDoc.data() as Solpes;
        const items = solpedData.items || [];

        const newItem = { ...this.selectedItem };
        newItem.id = newItem.id || this.firestore.createId();
        items.push(newItem);

        await solpedRef.update({ items });
        await this.firestore.collection('items').doc(this.selectedItem.id).delete();

        const successAlert = await this.alertCtrl.create({
          header: '¡Éxito!',
          message: 'Ítem añadido correctamente a la SOLPED.',
          buttons: ['OK'],
        });
        await successAlert.present();

        this.selectedItem = null;
        this.solpedSeleccionadaId = '';
        this.cargarSolped();
      }
    } catch (error) {
      console.error('Error al agregar el ítem a la SOLPED:', error);
    }
  }


  cargarSolped() {
    this.solpeService.obtenerTodasLasSolpes().subscribe((data: any[]) => {
      const filtradas = data.filter(solpe => solpe.estatus === 'Pre Aprobado');
      this.solpedList = filtradas.map((solpe: any) => {
        solpe.items = solpe.items
          ? solpe.items.map((item: any) => ({
              ...item,
              comparaciones: item.comparaciones || [],
            }))
          : [];
        return solpe;
      });
    });
  }
  async guardarItemTemporal(item: any, solpedId: string) {
    // Validar que todos los campos estén completos
    if (!item.item || !item.descripcion || !item.codigo_referencial ||
        item.cantidad == null || item.stock == null || !item.numero_interno) {
      const alert = await this.alertCtrl.create({
        header: 'Faltan datos',
        message: 'Todos los campos del ítem son obligatorios.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    // Set the selected item
    this.selectedItem = item;

    // Remover el item de la lista local
    const solped = this.solpedList.find(s => s.id === solpedId);
    if (solped) {
      const index = solped.items.indexOf(item);
      if (index > -1) {
        solped.items.splice(index, 1); // Quitar de la lista visual
        await this.eliminarItemDeFirestore(solpedId, item.id); // Eliminar de la BD
      }
    }

    // Subir el ítem a Firestore
    await this.subirItemAFirestore();
  }


async eliminarItemDeFirestore(solpedId: string, itemId: string) {
    const solpedRef = this.firestore.collection('solpes').doc(solpedId);

    try {
        const solpedDoc = await solpedRef.get().toPromise();

        if (solpedDoc && solpedDoc.exists) {
            const solpedData = solpedDoc.data() as Solpes;
            const items = solpedData?.items || [];

            const itemIndex = items.findIndex(i => i.id === itemId);
            if (itemIndex !== -1) {
                items.splice(itemIndex, 1);
                await solpedRef.update({ items });
            } else {
                console.log('❌ Ítem no encontrado en Firestore');
            }
        } else {
            console.log('❌ Documento no encontrado o vacío');
        }
    } catch (error) {
        console.error('Error al eliminar el item de Firestore:', error);
    }
}
obtenerItemsGuardados() {
  this.firestore.collection('items').snapshotChanges().subscribe(snapshot => {
    this.itemsGuardados = snapshot.map(doc => {
      const data = doc.payload.doc.data() as any;
      const id = doc.payload.doc.id;
      return { id, ...data };
    });
  });
}



async subirItemAFirestore() {
  try {
    if (!this.selectedItem.item || !this.selectedItem.descripcion || !this.selectedItem.codigo_referencial ||
        this.selectedItem.cantidad == null || this.selectedItem.stock == null || !this.selectedItem.numero_interno) {
      const alert = await this.alertCtrl.create({
        header: 'Faltan datos',
        message: 'Todos los campos del ítem son obligatorios.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    const itemRef = this.firestore.collection('items').doc();

    await itemRef.set({
      item: this.selectedItem.item,
      descripcion: this.selectedItem.descripcion,
      codigo_referencial: this.selectedItem.codigo_referencial,
      cantidad: this.selectedItem.cantidad,
      stock: this.selectedItem.stock,
      numero_interno: this.selectedItem.numero_interno
    });

    const alert = await this.alertCtrl.create({
      header: 'Éxito',
      message: 'El ítem ha sido subido a Firestore.',
      buttons: ['OK'],
    });
    await alert.present();
    this.selectedItem = null;

  } catch (error) {
    console.error('Error al subir el ítem:', error);
    const errorAlert = await this.alertCtrl.create({
      header: 'Error',
      message: 'Hubo un problema al subir el ítem.',
      buttons: ['OK'],
    });
    await errorAlert.present();
  }
}






  async aprobarSolped(solped: any) {
    if (!solped.comentario || solped.comentario.trim() === '') {
      const alert = await this.alertCtrl.create({
        header: 'Advertencia',
        message: 'Debe ingresar un comentario para aprobar la SOLPED.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    this.actualizarEstado(solped.id, 'Aprobado', solped.comentario);
  }

  rechazarSolped(solped: any) {
    const comentario = solped.comentario ? solped.comentario : '';
    this.actualizarEstado(solped.id, 'Rechazado', comentario);
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

      this.cargarSolped();
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
            item.comparaciones.splice(comparacionIndex, 1);
            await solpedRef.update({ items });
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

