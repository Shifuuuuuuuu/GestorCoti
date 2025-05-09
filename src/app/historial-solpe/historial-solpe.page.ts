import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MenuController, ToastController } from '@ionic/angular';
import { ArchivoPDF } from '../Interface/IArchivoPDF';

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
  filtroContrato: string = '';

  filtroFecha: string = '';
  filtroEstatus: string = '';
  filtroResponsable: string = '';
  filtroUsuario: string = '';
  mostrarFiltros: boolean = false;
  listaUsuarios: any[] = [];
  listaEstatus: string[] = ['Aprobado', 'Rechazado', 'Solicitado', 'Tránsito a Faena', 'Pre Aprobado'];
  solpesFiltradas: any[] = [];
  solpesOriginal: any[] = [];
  ordenAscendente: boolean = true;
  historialEstados: Array<{ fecha: any; estatus: string; usuario: string }> = [];
  constructor(private firestore: AngularFirestore,private menu: MenuController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.cargarSolpes();
    this.cargarUsuarios();
  }
  cargarHistorialEstados(solpeId: string) {
    this.firestore
      .collection('solpes')
      .doc(solpeId)
      .collection('historialEstados', ref => ref.orderBy('fecha', 'asc'))
      .get()
      .subscribe(snapshot => {
        this.historialEstados = snapshot.docs.map(doc => {
          const d: any = doc.data();
          let fechaDate: Date;
          if (d.fecha?.toDate) {
            fechaDate = d.fecha.toDate();
          } else {
            fechaDate = new Date(d.fecha);
          }
          return {
            fecha: fechaDate,
            estatus: d.estatus,
            usuario: d.usuario
          };
        });
      }, error => {
        console.error('Error cargando historial de estados:', error);
        this.historialEstados = [];
      });
  }



  cargarSolpes() {
    this.firestore
      .collection('solpes', ref =>
        ref.orderBy('numero_solpe', 'desc')
      )
      .get()
      .subscribe(snapshot => {
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


  ionViewWillEnter() {
    this.menu.enable(false);
  }
  cargarUsuarios() {
    this.firestore.collection('Usuarios').get().subscribe(snapshot => {
      this.listaUsuarios = snapshot.docs.map(doc => {
        const data = doc.data() as { fullName: string };
        return {
          id: doc.id,
          fullName: data.fullName
        };
      });
    }, error => {
      console.error('Error recuperando usuarios:', error);
    });
  }
  verPDFComparacion(solpedId: string, pdfId: string) {
    this.firestore.collection('solpes').doc(solpedId).collection('pdfs').doc(pdfId).get().subscribe(doc => {
      if (!doc.exists) {
        this.mostrarToast('El PDF no fue encontrado', 'danger');
        return;
      }

      const data = doc.data() as ArchivoPDF;
      const base64 = data.base64;

      if (!base64) {
        this.mostrarToast('El archivo está vacío', 'danger');
        return;
      }

      const blob = this.base64ToBlob(base64, 'application/pdf');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    });
  }

  async descargarPDFComparacion(solpedId: string, pdfId: string, nombreEmpresa: string) {
    try {
      const doc = await this.firestore
        .collection('solpes')
        .doc(solpedId)
        .collection('pdfs')
        .doc(pdfId)
        .ref.get();

      if (!doc.exists) {
        this.mostrarToast('El PDF no fue encontrado', 'danger');
        return;
      }

      const data = doc.data() as ArchivoPDF;
      const base64 = data.base64;

      if (!base64) {
        this.mostrarToast('El PDF está vacío', 'danger');
        return;
      }

      const blob = this.base64ToBlob(base64, 'application/pdf');
      const url = URL.createObjectURL(blob);
      const fileName = data.nombre || 'Comparacion';
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      this.mostrarToast('Error al descargar el PDF', 'danger');
    }
  }


  base64ToBlob(base64: string, contentType: string): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  }

  async mostrarToast(mensaje: string, color: 'success' | 'warning' | 'danger' | 'primary' = 'primary') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }

  buscarSolpe() {
    this.firestore
      .collection('solpes', ref => ref.where('numero_solpe', '==', this.numeroBusqueda))
      .get()
      .subscribe(snapshot => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data() as any;
          this.solpeEncontrada = { id: doc.id, ...data };
          if (this.segmentoSeleccionado === 'estados') {
            this.cargarHistorialEstados(doc.id);
          }
        } else {
          this.solpeEncontrada = null;
          this.historialEstados = [];
        }
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
      const coincideContrato = this.filtroContrato ? solpe.numero_contrato === this.filtroContrato : true;

      return coincideFecha && coincideEstatus && coincideResponsable && coincideUsuario && coincideContrato;
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
  getColorByStatus(estatus: string) {
    switch (estatus) {
      case 'Aprobado':
        return '#28a745';
      case 'Rechazado':
        return '#dc3545';
      case 'Solicitado':
        return '#fd7e14';
      case 'Tránsito a Faena':
        return '#007bff';
      case 'Preaprobado':
        return '#ffc107';
      case 'OC enviada a Proveedor':
        return '#17a2b8';
      case 'Por Importación':
        return '#6f42c1';
      default:
        return '#6c757d';
    }
  }

}
