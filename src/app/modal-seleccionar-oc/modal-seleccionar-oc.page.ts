import { Component, Input, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-modal-seleccionar-oc',
  templateUrl: './modal-seleccionar-oc.page.html',
  styleUrls: ['./modal-seleccionar-oc.page.scss'],
})
export class ModalSeleccionarOcPage {
  @Input() numeroSolped: number = 0;
  @Input() solpedId: string = '';
  busquedaId: string = '';
  ocFiltrada: any = null;
  buscando: boolean = false;

  constructor(
    private firestore: AngularFirestore,
    private modalCtrl: ModalController
  ) {}

buscarOC() {
  const id = this.busquedaId.trim();

  if (!id) {
    this.ocFiltrada = null;
    return;
  }

  this.buscando = true;

  const idNumerico = Number(id); // ✅ convertir a número

  this.firestore.collection('ordenes_oc', ref =>
    ref.where('id', '==', idNumerico)
  ).get().subscribe({
    next: (snapshot) => {
      this.buscando = false;

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        this.ocFiltrada = { id: doc.id, ...(doc.data() as any) };
        console.log('✅ OC encontrada por campo id:', this.ocFiltrada);
      } else {
        this.ocFiltrada = null;
        console.log('❌ No se encontró ninguna OC con ese id');
      }
    },
    error: (error) => {
      this.buscando = false;
      console.error('❌ Error al buscar OC por campo id:', error);
      this.ocFiltrada = null;
    }
  });
}


async enlazarOC(oc: any) {
  await this.firestore
    .collection('solpes')
    .doc(this.solpedId)
    .collection('ocs')
    .doc(String(oc.id))  // ✅ convertir a string para evitar el error
    .set(oc);

  this.modalCtrl.dismiss({ mensaje: 'OC enlazada con éxito' });
}


  cerrar() {
    this.modalCtrl.dismiss();
  }
}
