import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HistorialOcPageRoutingModule } from './historial-oc-routing.module';

import { HistorialOcPage } from './historial-oc.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HistorialOcPageRoutingModule
  ],
  declarations: [HistorialOcPage]
})
export class HistorialOcPageModule {}
