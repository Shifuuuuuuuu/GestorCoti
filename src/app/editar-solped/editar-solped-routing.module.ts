import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EditarSolpedPage } from './editar-solped.page';

const routes: Routes = [
  {
    path: '',
    component: EditarSolpedPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditarSolpedPageRoutingModule {}
