import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VistaCotizacionesPageRoutingModule } from './vista-cotizaciones-routing.module';

import { VistaCotizacionesPage } from './vista-cotizaciones.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VistaCotizacionesPageRoutingModule
  ],
  declarations: [VistaCotizacionesPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]

})
export class VistaCotizacionesPageModule {}
