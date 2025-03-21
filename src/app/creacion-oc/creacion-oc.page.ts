import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertController } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';
import { Producto } from '../Interface/IProducto';

@Component({
  selector: 'app-creacion-oc',
  templateUrl: './creacion-oc.page.html',
  styleUrls: ['./creacion-oc.page.scss'],
})
export class CreacionOcPage implements OnInit {
  modoSeleccionado: string = 'Crear';
  subGrupo: string =''
  codigoGrupo: string ='';
  codigoSubGrupo: string ='';
  nombreProducto: string ='';
  nombreContinuo: string ='';
  numero: number =0;
  codigoProducto: string ='';
  descripcion: string ='';

  constructor(private firestore: AngularFirestore, private alertCtrl: AlertController) {}

  ngOnInit() {
    this.obtenerUltimoNumero();
  }

  actualizarSubGrupo() {
    if (this.codigoSubGrupo) {
      this.nombreProducto = this.codigoSubGrupo.substring(0, 4);
      this.actualizarNombreContinuo();
    }
  }

  actualizarNombreProducto() {
    if (this.descripcion) {
      this.nombreProducto = this.descripcion.substring(0, 5).toUpperCase();
      this.actualizarNombreContinuo();
    }
  }

  actualizarNombreContinuo() {
    if (this.codigoSubGrupo && this.nombreProducto && this.numero !== undefined) {
      this.nombreContinuo = `${this.codigoSubGrupo.substring(0, 4)}${this.nombreProducto}${this.numero}`;
      this.codigoProducto = this.nombreContinuo; // Asumiendo que el código de producto es igual al nombre continuo
    }
  }

  obtenerUltimoNumero() {
    this.firestore
      .collection('productos', ref => ref.orderBy('numero', 'desc').limit(1))
      .valueChanges()
      .subscribe((productos: any[]) => {
        if (productos.length > 0) {
          this.numero = productos[0].numero + 1;
        } else {
          this.numero = 1;
        }
        this.actualizarNombreContinuo();
      });
  }

  async crearProducto() {
    try {
      // Obtener subgrupo (4 primeros dígitos)
      const subGrupoExtract = this.codigoSubGrupo.toString().substring(0, 4);

      // Obtener nombreProducto (primeras 5 letras de la descripción)
      const nombreProductoExtract = this.descripcion.trim().substring(0, 5).toUpperCase();

      // Obtener el último número registrado para autoincrementar
      const snapshot = await lastValueFrom(this.firestore
        .collection('productos', ref => ref.orderBy('numero', 'desc').limit(1))
        .get());

      let nuevoNumero = 1;
      if (!snapshot.empty) {
        const lastNumero = (snapshot.docs[0].data() as Producto).Numero;
        nuevoNumero = lastNumero + 1;
      }

      // Generar nombreContinuo y código de producto
      const nombreContinuoGenerado = `${subGrupoExtract}${nombreProductoExtract}${nuevoNumero}`;
      const codigoProductoGenerado = `${subGrupoExtract}${nombreProductoExtract}${nuevoNumero}`;

      // Crear objeto del producto
      const producto = {
        subGrupo: subGrupoExtract,
        nombreProducto: nombreProductoExtract,
        nombreContinuo: nombreContinuoGenerado,
        numero: nuevoNumero,
        codigoProducto: codigoProductoGenerado,
        descripcion: this.descripcion,
        codigoGrupo: this.codigoGrupo,
        codigoSubGrupo: this.codigoSubGrupo,
        fechaCreacion: new Date()
      };

      // Guardar en Firestore
      await this.firestore.collection('productos').add(producto);

      this.mostrarAlerta('Producto creado con éxito');

      // Resetear los campos
      this.resetForm();

    } catch (error) {
      console.error('Error al crear producto:', error);
      this.mostrarAlerta('Error al crear el producto');
    }
  }

  async mostrarAlerta(mensaje: string) {
    const alert = await this.alertCtrl.create({
      header: 'Aviso',
      message: mensaje,
      buttons: ['OK'],
    });
    await alert.present();
  }

  resetForm() {
    this.subGrupo = '';
    this.nombreProducto = '';
    this.nombreContinuo = '';
    this.numero = 0;
    this.codigoProducto = '';
    this.descripcion = '';
    this.codigoGrupo = '';
    this.codigoSubGrupo = '';
  }
}
