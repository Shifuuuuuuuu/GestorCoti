import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GestorOcPageRoutingModule } from './gestor-oc-routing.module';

import { GestorOcPage } from './gestor-oc.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GestorOcPageRoutingModule
  ],
  declarations: [GestorOcPage]
})
export class GestorOcPageModule {}
