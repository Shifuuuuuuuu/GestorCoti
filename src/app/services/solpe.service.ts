import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SolpeService {

  constructor(private firestore: AngularFirestore) {}

  guardarSolpe(solpe: any) {
    return this.firestore.collection('solpes').add(solpe);
  }

  obtenerSolpes() {
    return this.firestore.collection('solpes').snapshotChanges();
  }
  obtenerUltimaSolpe() {
    return this.firestore.collection('solpes', ref => ref.orderBy('numero_solpe', 'desc').limit(1))
      .valueChanges();
  }
  obtenerTodasLasSolpes() {
    return this.firestore.collection('solpes').snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data: any = a.payload.doc.data();
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }
}
