import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MenuOrdenesPageRoutingModule } from './menu-ordenes-routing.module';

import { MenuOrdenesPage } from './menu-ordenes.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MenuOrdenesPageRoutingModule
  ],
  declarations: [MenuOrdenesPage]
})
export class MenuOrdenesPageModule {}
