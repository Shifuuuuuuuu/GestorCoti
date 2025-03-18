import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GestorsolpesPage } from './gestorsolpes.page';

const routes: Routes = [
  {
    path: '',
    component: GestorsolpesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GestorsolpesPageRoutingModule {}
