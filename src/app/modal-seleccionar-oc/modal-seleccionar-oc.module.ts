import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ModalSeleccionarOcPageRoutingModule } from './modal-seleccionar-oc-routing.module';

import { ModalSeleccionarOcPage } from './modal-seleccionar-oc.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ModalSeleccionarOcPageRoutingModule
  ],
  declarations: [ModalSeleccionarOcPage]
})
export class ModalSeleccionarOcPageModule {}
