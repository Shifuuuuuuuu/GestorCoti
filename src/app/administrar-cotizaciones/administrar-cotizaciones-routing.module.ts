import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdministrarCotizacionesPage } from './administrar-cotizaciones.page';

const routes: Routes = [
  {
    path: '',
    component: AdministrarCotizacionesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdministrarCotizacionesPageRoutingModule {}
