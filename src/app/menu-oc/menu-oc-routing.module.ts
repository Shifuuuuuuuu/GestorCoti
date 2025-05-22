import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MenuOcPage } from './menu-oc.page';

const routes: Routes = [
  {
    path: '',
    component: MenuOcPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MenuOcPageRoutingModule {}
