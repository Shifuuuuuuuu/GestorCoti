import { Component, OnInit } from '@angular/core';
import { SolpeService } from '../services/solpe.service';
import { AlertController, MenuController, ToastController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-gestorsolpes',
  templateUrl: './gestorsolpes.page.html',
  styleUrls: ['./gestorsolpes.page.scss'],
})
export class GestorsolpesPage implements OnInit {
  solpes: any[] = [];
  loading: boolean = true;
  solpesFiltradas: any[] = [];
  dataFacturaPDF: string = '';

  constructor(
    private solpeService: SolpeService,
    private alertController: AlertController,
    private firestore: AngularFirestore,
    private toastController: ToastController,
    private menu: MenuController,
  ) {}

  ngOnInit() {
    setTimeout(() => {
      this.cargarSolpes();
      this.loading = false;
    }, 2000);
  }
  verFactura(base64Data: string) {
    const blob = this.base64ToBlob(base64Data, 'application/pdf');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
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
  mostrarFacturaComoImagen(base64Data: string) {
    // Si fuera imagen (JPG o PNG), ajusta el mime type:
    const imageUrl = 'data:image/jpeg;base64,' + base64Data; // O image/png

    const nuevaVentana = window.open();
    if (nuevaVentana) {
      nuevaVentana.document.write(`
        <html>
          <head><title>Factura</title></head>
          <body style="margin:0; display:flex; justify-content:center; align-items:center; height:100vh;">
            <img src="${imageUrl}" style="max-width:100%; max-height:100%;">
          </body>
        </html>
      `);
    } else {
      console.error("No se pudo abrir una nueva ventana.");
    }
  }



  cargarSolpes() {
    this.solpeService.obtenerTodasLasSolpes().subscribe((data: any[]) => {
      const filtradas = data.filter(solpe => solpe.estatus === 'Solicitado');
      this.solpes = filtradas.map((solpe: any) => {
        solpe.items = solpe.items.map((item: any) => ({
          ...item,
          comparaciones: item.comparaciones || [],
        }));
        return solpe;
      });
    });
  }
  ionViewWillEnter() {
    this.menu.enable(false);
  }

  async cambiarEstatus(solpe: any) {
    const alert = await this.alertController.create({
      header: 'Cambiar Estado de la SOLPE',
      inputs: [
        { name: 'estatus', type: 'radio', label: 'Pre Aprobado', value: 'Pre Aprobado' },
        { name: 'estatus', type: 'radio', label: 'Tránsito a Faena', value: 'Rechazado' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Siguiente',
          handler: async (estatusSeleccionado) => {
            if (estatusSeleccionado) {
              if (estatusSeleccionado === 'Pre Aprobado') {
                await this.subirComparaciones(solpe, true);
              }

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


  async abrirComparacion(item: any) {
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
          handler: (data) => {
            if (data.empresa && data.precio) {

              const nuevoId = Date.now();
              item.comparaciones.push({
                id: nuevoId,
                empresa: data.empresa,
                precio: Number(data.precio)
              });
            }
          },
        },
      ],
    });
    await alert.present();
  }

  guardarComparacion(item: any, solpeId: string) {
    const solpeRef = this.firestore.collection('solpes').doc(solpeId);
    const itemRef = solpeRef.collection('items').doc(item.id);

    itemRef.update({ comparaciones: item.comparaciones });
  }

  eliminarComparacion(item: any, index: number) {
    item.comparaciones.splice(index, 1);
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
