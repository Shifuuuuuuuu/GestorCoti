import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SolpePage } from './solpe.page';

const routes: Routes = [
  {
    path: '',
    component: SolpePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SolpePageRoutingModule {}
