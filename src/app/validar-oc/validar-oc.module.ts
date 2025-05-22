import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ValidarOcPageRoutingModule } from './validar-oc-routing.module';

import { ValidarOcPage } from './validar-oc.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ValidarOcPageRoutingModule
  ],
  declarations: [ValidarOcPage]
})
export class ValidarOcPageModule {}
