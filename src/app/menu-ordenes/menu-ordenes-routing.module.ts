import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MenuOrdenesPage } from './menu-ordenes.page';

const routes: Routes = [
  {
    path: '',
    component: MenuOrdenesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MenuOrdenesPageRoutingModule {}
