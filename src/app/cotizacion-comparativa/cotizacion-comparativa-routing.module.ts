import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CotizacionComparativaPage } from './cotizacion-comparativa.page';

const routes: Routes = [
  {
    path: '',
    component: CotizacionComparativaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CotizacionComparativaPageRoutingModule {}
