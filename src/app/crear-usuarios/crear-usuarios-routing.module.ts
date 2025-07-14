import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CrearUsuariosPage } from './crear-usuarios.page';

const routes: Routes = [
  {
    path: '',
    component: CrearUsuariosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CrearUsuariosPageRoutingModule {}
