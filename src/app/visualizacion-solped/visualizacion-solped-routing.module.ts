import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VisualizacionSolpedPage } from './visualizacion-solped.page';

const routes: Routes = [
  {
    path: '',
    component: VisualizacionSolpedPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VisualizacionSolpedPageRoutingModule {}
