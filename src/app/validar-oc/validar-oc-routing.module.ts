import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ValidarOcPage } from './validar-oc.page';

const routes: Routes = [
  {
    path: '',
    component: ValidarOcPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ValidarOcPageRoutingModule {}
