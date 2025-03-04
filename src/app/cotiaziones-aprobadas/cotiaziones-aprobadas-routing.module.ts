import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CotiazionesAprobadasPage } from './cotiaziones-aprobadas.page';

const routes: Routes = [
  {
    path: '',
    component: CotiazionesAprobadasPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CotiazionesAprobadasPageRoutingModule {}
