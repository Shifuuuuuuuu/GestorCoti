import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CotizacionComparativaPageRoutingModule } from './cotizacion-comparativa-routing.module';

import { CotizacionComparativaPage } from './cotizacion-comparativa.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CotizacionComparativaPageRoutingModule
  ],
  declarations: [CotizacionComparativaPage]
})
export class CotizacionComparativaPageModule {}
