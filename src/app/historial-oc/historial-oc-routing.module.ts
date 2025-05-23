import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HistorialOcPage } from './historial-oc.page';

const routes: Routes = [
  {
    path: '',
    component: HistorialOcPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HistorialOcPageRoutingModule {}
