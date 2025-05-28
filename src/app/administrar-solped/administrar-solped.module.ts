import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AdministrarSolpedPageRoutingModule } from './administrar-solped-routing.module';

import { AdministrarSolpedPage } from './administrar-solped.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdministrarSolpedPageRoutingModule
  ],
  declarations: [AdministrarSolpedPage]
})
export class AdministrarSolpedPageModule {}
