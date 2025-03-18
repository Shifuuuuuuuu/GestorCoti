import { Component, OnInit } from '@angular/core';
import { CotizacionService } from '../services/cotizacion.service';
import { ModalController, ToastController } from '@ionic/angular';
import { SolpeService } from '../services/solpe.service';
import { Item } from '../Interface/IItem';

@Component({
  selector: 'app-solpe',
  templateUrl: './solpe.page.html',
  styleUrls: ['./solpe.page.scss'],
})
export class SolpePage implements OnInit  {
  modoSeleccionado: string = 'formulario';

  solpe: any = {
    numero_solpe: null,
    fecha: '',
    numero_contrato: '',
    usuario: '',
    items: [],
    estatus: 'Solicitado',
  };

  constructor(
    private solpeService: SolpeService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    const hoy = new Date();
    this.solpe.fecha = hoy.toISOString().split('T')[0];
    this.obtenerUltimoNumeroSolpe();
  }

  obtenerUltimoNumeroSolpe() {
    this.solpeService.obtenerUltimaSolpe().subscribe((solpes: any[]) => {
      if (solpes.length > 0) {
        const ultimoNumero = solpes[0].numero_solpe;
        this.solpe.numero_solpe = ultimoNumero + 1;
      } else {
        this.solpe.numero_solpe = 1;
      }
    });
  }

  agregarFila() {
    this.solpe.items.push({
      descripcion: '',
      codigo_referencial: '',
      cantidad: null,
      editando: true,  // La fila inicia en edición
    });
  }

  eliminarItem(index: number) {
    this.solpe.items.splice(index, 1);
    this.mostrarToast('Item eliminado', 'danger');
  }

  editarItem(index: number) {
    this.solpe.items[index].editando = true;
  }

  guardarEdicion(index: number) {
    this.solpe.items[index].editando = false;
    this.mostrarToast('Item actualizado', 'success');
  }

  guardarSolpe() {
    if (this.solpe.items.length === 0) {
      this.mostrarToast('Debes agregar al menos un item', 'warning');
      return;
    }

    // Asignar el número de item autoincremental antes de guardar
    this.solpe.items = this.solpe.items.map((item: Item, index: number) => ({
      item: index + 1,
      descripcion: item.descripcion,
      codigo_referencial: item.codigo_referencial,
      cantidad: item.cantidad
    }));


    // Formatear la fecha
    const hoy = new Date();
    this.solpe.fecha = `${hoy.getDate().toString().padStart(2, '0')}/${(hoy.getMonth() + 1).toString().padStart(2, '0')}/${hoy.getFullYear()}`;

    // Guardar en la base de datos
    this.solpeService.guardarSolpe(this.solpe).then(() => {
      this.mostrarToast('SOLPE guardada con éxito', 'success');
      this.resetearFormulario();
    }).catch(err => {
      console.error(err);
      this.mostrarToast('Error al guardar la SOLPE', 'danger');
    });
  }

  resetearFormulario() {
    this.solpe = {
      numero_solpe: null,
      fecha: '',
      numero_contrato: '',
      usuario: '',
      items: [],
      estatus: 'Solicitado',
    };
    this.obtenerUltimoNumeroSolpe();
  }

  async mostrarToast(mensaje: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      color: color
    });
    toast.present();
  }
}
