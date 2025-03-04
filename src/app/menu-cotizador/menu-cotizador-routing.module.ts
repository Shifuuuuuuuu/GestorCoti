import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MenuCotizadorPage } from './menu-cotizador.page';

const routes: Routes = [
  {
    path: '',
    component: MenuCotizadorPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MenuCotizadorPageRoutingModule {}
