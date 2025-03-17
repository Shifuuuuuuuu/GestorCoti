import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CertificadosMantencionesPage } from './certificados-mantenciones.page';

const routes: Routes = [
  {
    path: '',
    component: CertificadosMantencionesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CertificadosMantencionesPageRoutingModule {}
