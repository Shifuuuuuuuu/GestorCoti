import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AdministrarCotizacionesPageRoutingModule } from './administrar-cotizaciones-routing.module';

import { AdministrarCotizacionesPage } from './administrar-cotizaciones.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdministrarCotizacionesPageRoutingModule
  ],
  declarations: [AdministrarCotizacionesPage]
})
export class AdministrarCotizacionesPageModule {}
