import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GeneradorOrdenesPage } from './generador-ordenes.page';

const routes: Routes = [
  {
    path: '',
    component: GeneradorOrdenesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GeneradorOrdenesPageRoutingModule {}
