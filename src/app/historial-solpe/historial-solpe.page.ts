import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-historial-solpe',
  templateUrl: './historial-solpe.page.html',
  styleUrls: ['./historial-solpe.page.scss'],
})
export class HistorialSolpePage implements OnInit {
  segmentoSeleccionado: string = 'historial';
  numeroBusqueda: number | undefined;
  solpeEncontrada: any = null;
  buscado: boolean = false;

  filtroFecha: string = '';
  filtroEstatus: string = '';
  filtroResponsable: string = '';
  filtroUsuario: string = '';
  mostrarFiltros: boolean = false;

  solpesFiltradas: any[] = [];
  solpesOriginal: any[] = [];

  constructor(private firestore: AngularFirestore) {}

  ngOnInit() {
    this.cargarSolpes();
  }

  cargarSolpes() {
    this.firestore.collection('solpes').get().subscribe(snapshot => {
      const solpesTemp: any[] = [];

      snapshot.docs.forEach((doc: any) => {
        const solpe = doc.data();
        solpe.id = doc.id;
        solpe.items = [];
        solpe.comparaciones = [];
        this.firestore.collection('solpes').doc(doc.id).collection('items').get().subscribe(itemSnapshot => {
          solpe.items = itemSnapshot.docs.map(itemDoc => itemDoc.data());
        });
        this.firestore.collection('items').doc(doc.id).collection('comparaciones').get().subscribe(compSnapshot => {
          solpe.comparaciones = compSnapshot.docs.map(compDoc => compDoc.data());
        });

        solpesTemp.push(solpe);
      });
      this.solpesOriginal = solpesTemp;
      this.solpesFiltradas = [...this.solpesOriginal];
    });
  }

  buscarSolpe() {
    this.firestore
      .collection('solpes', ref => ref.where('numero_solpe', '==', this.numeroBusqueda))
      .get()
      .subscribe(snapshot => {
        if (!snapshot.empty) {
          this.solpeEncontrada = snapshot.docs[0].data();
        } else {
          this.solpeEncontrada = null;
        }
        this.buscado = true;
      });
  }
  filtrarSolpes() {
    this.solpesFiltradas = this.solpesOriginal.filter(solpe => {
      let fechaSolpe = '';

      if (solpe.fecha) {
        try {
          if (solpe.fecha.toDate) {
            fechaSolpe = solpe.fecha.toDate().toISOString().split('T')[0];
          } else {
            const fechaTemp = new Date(solpe.fecha);
            if (!isNaN(fechaTemp.getTime())) {
              fechaSolpe = fechaTemp.toISOString().split('T')[0];
            } else {
              console.warn('Fecha inválida encontrada:', solpe.fecha);
              fechaSolpe = '';
            }
          }
        } catch (error) {
          console.error('Error procesando la fecha:', error);
          fechaSolpe = '';
        }
      }

      const coincideFecha = this.filtroFecha ? fechaSolpe === this.filtroFecha : true;
      const coincideEstatus = this.filtroEstatus ? solpe.estatus?.toLowerCase().includes(this.filtroEstatus.toLowerCase()) : true;
      const coincideResponsable = this.filtroResponsable ? solpe.numero_contrato?.toLowerCase().includes(this.filtroResponsable.toLowerCase()) : true;
      const coincideUsuario = this.filtroUsuario ? solpe.usuario?.toLowerCase().includes(this.filtroUsuario.toLowerCase()) : true;

      return coincideFecha && coincideEstatus && coincideResponsable && coincideUsuario;
    });
  }

  limpiarFiltros() {
    this.filtroFecha = '';
    this.filtroEstatus = '';
    this.filtroResponsable = '';
    this.filtroUsuario = '';
    this.solpesFiltradas = [...this.solpesOriginal];
  }
}
