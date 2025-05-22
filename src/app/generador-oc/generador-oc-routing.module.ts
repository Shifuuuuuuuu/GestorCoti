import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GeneradorOcPage } from './generador-oc.page';

const routes: Routes = [
  {
    path: '',
    component: GeneradorOcPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GeneradorOcPageRoutingModule {}
