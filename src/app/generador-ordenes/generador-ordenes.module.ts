import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GeneradorOrdenesPageRoutingModule } from './generador-ordenes-routing.module';

import { GeneradorOrdenesPage } from './generador-ordenes.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GeneradorOrdenesPageRoutingModule
  ],
  declarations: [GeneradorOrdenesPage]
})
export class GeneradorOrdenesPageModule {}
