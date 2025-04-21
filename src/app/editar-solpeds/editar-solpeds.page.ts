import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute } from '@angular/router';
import { AlertController, MenuController, ToastController } from '@ionic/angular';
import { Solpes } from '../Interface/ISolpes';
import { Item } from '../Interface/IItem';
import { Comparaciones } from '../Interface/Icompara';

@Component({
  selector: 'app-editar-solpeds',
  templateUrl: './editar-solpeds.page.html',
  styleUrls: ['./editar-solpeds.page.scss'],
})
export class EditarSolpedsPage implements OnInit {
  segmentoSeleccionado: string = 'historial';
  numeroBusqueda: number | undefined;
  solpeEncontrada: any = null;
  buscado: boolean = false;
  filtroContrato: string = '';
  solpeExpandidaId: string | null = null;
  filtroFecha: string = '';
  filtroEstatus: string = '';
  filtroResponsable: string = '';
  filtroUsuario: string = '';
  mostrarFiltros: boolean = false;
  solpe: any;
  solpes: any[] = [];
  solpedId: string = '';
  dataFacturaPDF: string = '';
  items: any[] = [];
  listaUsuarios: any[] = [];
  listaEstatus: string[] = ['Aprobado', 'Rechazado', 'Solicitado', 'Tránsito a Faena', 'Pre Aprobado'];
  solpesFiltradas: any[] = [];
  solpesOriginal: any[] = [];
  ordenAscendente: boolean = true;
  loading: boolean = true;

  constructor(
    private firestore: AngularFirestore,
    private menu: MenuController,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private toastController: ToastController,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const solpeId = this.route.snapshot.paramMap.get('id');
    if (solpeId) {
      this.firestore.collection('solpes').doc(solpeId).get().subscribe(doc => {
        if (doc.exists) {
          this.solpe = doc.data();
          this.solpe.id = doc.id;
        }
      });
    }
    this.cargarSolpes();
    this.cargarUsuarios();
  this.cdRef.detectChanges();
  }

  ionViewWillEnter() {
    this.menu.enable(false);
  }

  toggleDetalle(solpeId: string) {
    this.solpeExpandidaId = this.solpeExpandidaId === solpeId ? null : solpeId;
  }
  async eliminarComparacionFirestore(solpedId: string, itemId: string, comparacionId: number) {
    const solpedRef = this.firestore.collection('solpes').doc(solpedId);

    try {
      const solpedDoc = await solpedRef.get().toPromise();

      if (solpedDoc && solpedDoc.exists) {
        const solpedData = solpedDoc.data() as Solpes;
        const items: Item[] = solpedData?.items || [];

        const item = items.find((i: Item) => i.id === itemId);
        if (item) {
          const comparacionIndex = item.comparaciones.findIndex(
            (comp: Comparaciones) => comp.id === comparacionId
          );

          if (comparacionIndex !== -1) {
            item.comparaciones = item.comparaciones.filter(
              (comp: Comparaciones) => comp.id !== comparacionId
            );
            await solpedRef.update({ items });
            this.mostrarToast('Comparación eliminada de Firestore', 'success');
          } else {
            console.log('❌ Comparación no encontrada');
            this.mostrarToast('Comparación no encontrada', 'danger');
          }
        } else {
          console.log('❌ Ítem no encontrado');
          this.mostrarToast('Ítem no encontrado', 'danger');
        }
      } else {
        console.log('❌ Documento no encontrado o vacío');
        this.mostrarToast('Documento no encontrado o vacío', 'danger');
      }
    } catch (error) {
      console.error('Error eliminando la comparación:', error);
      this.mostrarToast('Error al eliminar la comparación en Firestore', 'danger');
    }
  }
  eliminarComparacionLocal(item: any, index: number) {
    item.comparaciones.splice(index, 1);
    this.mostrarToast('Comparación eliminada de la UI', 'success');
  }

  async eliminarComparacionCompleta(solpedId: string, itemId: string, comparacionId: number, item: any, index: number) {
    await this.eliminarComparacionFirestore(solpedId, itemId, comparacionId);
    item.comparaciones.splice(index, 1);
    this.cdRef.detectChanges();
  }


  destacarComparacion(item: any, index: number) {
    item.comparaciones[index].destacado = !item.comparaciones[index].destacado;
    const solpeRef = this.firestore.collection('solpes').doc(item.solpeId);
    solpeRef.update({
      items: item.comparaciones
    }).then(() => {
      console.log('Comparación actualizada en Firestore');
    }).catch(err => {
      console.error('Error al actualizar comparación:', err);
    });
  }
  async abrirComparacion(item: any, solpeId: string) {
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
          handler: async (data) => {
            if (data.empresa && data.precio) {
              if (!item.comparaciones) {
                item.comparaciones = [];
              }

              const nuevoId = Date.now();
              const nuevaComparacion = {
                id: nuevoId,
                empresa: data.empresa,
                precio: Number(data.precio)
              };

              item.comparaciones.push(nuevaComparacion);

              try {
                const solpeRef = this.firestore.collection('solpes').doc(solpeId);
                const solpeDoc = await solpeRef.get().toPromise();

                if (solpeDoc && solpeDoc.exists) {
                  const solpeData = solpeDoc.data() as any;
                  const items = solpeData.items || [];

                  const itemIndex = items.findIndex((i: any) => i.id === item.id);
                  if (itemIndex !== -1) {
                    items[itemIndex].comparaciones = item.comparaciones;

                    await solpeRef.update({ items });
                    this.mostrarToast('Comparación agregada', 'success');
                  }
                }
              } catch (error) {
                console.error('Error al guardar comparación:', error);
                this.mostrarToast('Error al agregar la comparación', 'danger');
              }

              return true;
            } else {
              this.mostrarToast('Debes completar ambos campos', 'danger');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }



  async subirComparaciones(solpe: any, auto: boolean = false) {
    if (!auto) {
      const confirm = await this.alertController.create({
        header: 'Confirmar',
        message: '¿Estás seguro de subir las comparaciones a Firestore?',
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          {
            text: 'Sí, subir',
            handler: () => this.guardarComparacionesEnFirestore(solpe)
          }
        ]
      });
      await confirm.present();
    } else {
      this.guardarComparacionesEnFirestore(solpe);
    }
  }
  guardarComparacionesEnFirestore(solpe: any) {
    solpe.items.forEach((item: any) => {
      if (!item.comparaciones || item.comparaciones.length === 0) {
        item.comparaciones = [{
          empresa: 'Sin proveedor válido',
          precio: 0,
          observacion: 'Este proveedor no tenía lo que se buscaba'
        }];
      }
    });

    this.firestore.collection('solpes').doc(solpe.id).update({
      items: solpe.items
    }).then(() => {
      console.log('Comparaciones subidas a Firestore automáticamente');
    }).catch(err => {
      console.error('Error al subir comparaciones:', err);
    });
  }
  validarComparaciones(solpe: any): boolean {
    return solpe.items.every((item: any) => item.comparaciones && item.comparaciones.length > 0);
  }
  guardarComparacion(item: any, solpeId: string) {
    const solpeRef = this.firestore.collection('solpes').doc(solpeId);
    const itemRef = solpeRef.collection('items').doc(item.id);

    itemRef.update({ comparaciones: item.comparaciones });
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
      this.loading = false;
    });
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
  filtrarSolpes() {
    const normalize = (str: string) => str?.toLowerCase().trim();

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
      const coincideEstatus = this.filtroEstatus ? normalize(solpe.estatus) === normalize(this.filtroEstatus) : true;
      const coincideResponsable = this.filtroResponsable ? solpe.numero_contrato?.toLowerCase().includes(this.filtroResponsable) : true;
      const pasaFiltro = coincideFecha && coincideEstatus && coincideResponsable;
      console.log(pasaFiltro, solpe);
      return pasaFiltro;
    });

    console.log(this.solpesFiltradas);
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
      case 'Pre Aprobado':
        return '#ffc107';
      case 'Oc enviada a Proveedor':
        return '#17a2b8';
      case 'Por Importación':
        return '#6f42c1';
      default:
        return '#6c757d';
    }
  }


  verPDFComparacion(solpedId: string, pdfId: string) {
    this.firestore.collection('solpes').doc(solpedId).collection('pdfs').doc(pdfId).get().subscribe(doc => {
      if (!doc.exists) {
        this.mostrarToast('El PDF no fue encontrado', 'danger');
        return;
      }

      const data = doc.data() as { base64: string };
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

  descargarPDFComparacion(solpedId: string, pdfId: string) {
    this.firestore.collection('solpes').doc(solpedId).collection('pdfs').doc(pdfId).get().subscribe(doc => {
      if (!doc.exists) {
        this.mostrarToast('El PDF no fue encontrado', 'danger');
        return;
      }

      const data = doc.data() as { base64: string, nombre: string };
      const base64 = data.base64;

      if (!base64) {
        this.mostrarToast('El archivo está vacío', 'danger');
        return;
      }

      const blob = this.base64ToBlob(base64, 'application/pdf');
      const url = URL.createObjectURL(blob);
      const fileName = data.nombre || 'Comparacion.pdf';

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
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
  async cambiarEstatus(solpe: any) {
    const alert = await this.alertController.create({
      header: 'Cambiar Estado de la SOLPE',
      inputs: [
        { name: 'estatus', type: 'radio', label: 'Aprobado', value: 'Aprobado' },
        { name: 'estatus', type: 'radio', label: 'Rechazado', value: 'Rechazado' },
        { name: 'estatus', type: 'radio', label: 'Solicitado', value: 'Solicitado' },
        { name: 'estatus', type: 'radio', label: 'Tránsito a Faena', value: 'Tránsito a Faena' },
        { name: 'estatus', type: 'radio', label: 'Pre Aprobado', value: 'Pre Aprobado' },
        { name: 'estatus', type: 'radio', label: 'Oc enviada a Proveedor', value: 'Oc enviada a Proveedor' },
        { name: 'estatus', type: 'radio', label: 'Por Importación', value: 'Por Importación' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Siguiente',
          handler: async (estatusSeleccionado) => {
            if (estatusSeleccionado) {
              this.firestore.collection('solpes').doc(solpe.id).update({
                estatus: estatusSeleccionado,
              }).then(() => {
                solpe.estatus = estatusSeleccionado;
                this.mostrarToast(`SOLPE marcada como "${estatusSeleccionado}"`, 'success');
              }).catch(err => {
                this.mostrarToast('Error al actualizar estatus', 'danger');
                console.error(err);
              });
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async mostrarToast(mensaje: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      color: color,
      position: 'top'
    });
    toast.present();
  }
}

