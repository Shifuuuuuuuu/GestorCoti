import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HistorialOrdenesPage } from './historial-ordenes.page';

const routes: Routes = [
  {
    path: '',
    component: HistorialOrdenesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HistorialOrdenesPageRoutingModule {}
