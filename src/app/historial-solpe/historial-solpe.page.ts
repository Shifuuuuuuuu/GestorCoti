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
  ordenAscendente: boolean = true;
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
          if (typeof solpe.fecha === 'string' && solpe.fecha.includes('/')) {
            const partes = solpe.fecha.split('/');
            if (partes.length === 3) {
              fechaSolpe = `${partes[2]}-${partes[1]}-${partes[0]}`;
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
  ordenarSolpes() {
    this.ordenAscendente = !this.ordenAscendente;
    this.solpesFiltradas.sort((a, b) => {
      return this.ordenAscendente
        ? a.numero_solpe - b.numero_solpe
        : b.numero_solpe - a.numero_solpe;
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
