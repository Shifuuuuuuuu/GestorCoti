import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MenuOcPageRoutingModule } from './menu-oc-routing.module';

import { MenuOcPage } from './menu-oc.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MenuOcPageRoutingModule
  ],
  declarations: [MenuOcPage]
})
export class MenuOcPageModule {}
