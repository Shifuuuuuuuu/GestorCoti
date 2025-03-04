import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MenuCotizadorPageRoutingModule } from './menu-cotizador-routing.module';

import { MenuCotizadorPage } from './menu-cotizador.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MenuCotizadorPageRoutingModule
  ],
  declarations: [MenuCotizadorPage]
})
export class MenuCotizadorPageModule {}
