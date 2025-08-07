import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ModalSeleccionarOcPage } from './modal-seleccionar-oc.page';

const routes: Routes = [
  {
    path: '',
    component: ModalSeleccionarOcPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ModalSeleccionarOcPageRoutingModule {}
