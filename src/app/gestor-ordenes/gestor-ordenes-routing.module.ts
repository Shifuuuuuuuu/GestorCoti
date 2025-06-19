import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GestorOrdenesPage } from './gestor-ordenes.page';

const routes: Routes = [
  {
    path: '',
    component: GestorOrdenesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GestorOrdenesPageRoutingModule {}
