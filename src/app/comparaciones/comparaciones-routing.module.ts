import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ComparacionesPage } from './comparaciones.page';

const routes: Routes = [
  {
    path: '',
    component: ComparacionesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ComparacionesPageRoutingModule {}
