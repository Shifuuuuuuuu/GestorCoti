import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VistaCotizacionesPage } from './vista-cotizaciones.page';

const routes: Routes = [
  {
    path: '',
    component: VistaCotizacionesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VistaCotizacionesPageRoutingModule {}
