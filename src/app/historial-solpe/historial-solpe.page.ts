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
  mostrarFiltros: boolean = false;  // Controla el mostrar/ocultar

  solpesFiltradas: any[] = [];
  solpesOriginal: any[] = [];

  constructor(private firestore: AngularFirestore) {}

  ngOnInit() {
    this.cargarSolpes();
  }

  cargarSolpes() {
    // Obtener los documentos de SOLPES
    this.firestore.collection('solpes').get().subscribe(snapshot => {
      this.solpesOriginal = snapshot.docs.map((doc: any) => {
        const solpe = doc.data();
        this.firestore.collection('solpes').doc(doc.id).collection('items').get().subscribe(itemSnapshot => {
          const items = itemSnapshot.docs.map(itemDoc => itemDoc.data());

          // Agregar los items al solpe
          solpe.items = items || [];
        });

        return solpe;
      });

      // Clonar los solpes originales en el array de filtrados
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
          // Si viene como Timestamp de Firestore
          if (solpe.fecha.toDate) {
            fechaSolpe = solpe.fecha.toDate().toISOString().split('T')[0];
          } else {
            // Verificamos si es un string o Date válido
            const fechaTemp = new Date(solpe.fecha);
            if (!isNaN(fechaTemp.getTime())) {
              fechaSolpe = fechaTemp.toISOString().split('T')[0];
            } else {
              console.warn('Fecha inválida encontrada:', solpe.fecha);
              fechaSolpe = ''; // Forzamos vacío para no hacer match
            }
          }
        } catch (error) {
          console.error('Error procesando la fecha:', error);
          fechaSolpe = ''; // Evita que rompa la ejecución
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
