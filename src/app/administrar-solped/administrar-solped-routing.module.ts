import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdministrarSolpedPage } from './administrar-solped.page';

const routes: Routes = [
  {
    path: '',
    component: AdministrarSolpedPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdministrarSolpedPageRoutingModule {}
