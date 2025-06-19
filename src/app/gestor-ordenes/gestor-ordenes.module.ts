import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GestorOrdenesPageRoutingModule } from './gestor-ordenes-routing.module';

import { GestorOrdenesPage } from './gestor-ordenes.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GestorOrdenesPageRoutingModule
  ],
  declarations: [GestorOrdenesPage]
})
export class GestorOrdenesPageModule {}
