import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EditarSolpedsPage } from './editar-solpeds.page';

const routes: Routes = [
  {
    path: '',
    component: EditarSolpedsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditarSolpedsPageRoutingModule {}
