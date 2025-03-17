import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HistorialSolpePage } from './historial-solpe.page';

const routes: Routes = [
  {
    path: '',
    component: HistorialSolpePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HistorialSolpePageRoutingModule {}
