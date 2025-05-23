import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GestorOcPage } from './gestor-oc.page';

const routes: Routes = [
  {
    path: '',
    component: GestorOcPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GestorOcPageRoutingModule {}
