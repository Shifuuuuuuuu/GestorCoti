import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MenuSolpePage } from './menu-solpe.page';

const routes: Routes = [
  {
    path: '',
    component: MenuSolpePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MenuSolpePageRoutingModule {}
