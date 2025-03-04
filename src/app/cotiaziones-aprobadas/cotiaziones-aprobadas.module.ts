import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CotiazionesAprobadasPageRoutingModule } from './cotiaziones-aprobadas-routing.module';

import { CotiazionesAprobadasPage } from './cotiaziones-aprobadas.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CotiazionesAprobadasPageRoutingModule
  ],
  declarations: [CotiazionesAprobadasPage]
})
export class CotiazionesAprobadasPageModule {}
