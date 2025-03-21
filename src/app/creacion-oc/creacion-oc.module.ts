import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CreacionOcPageRoutingModule } from './creacion-oc-routing.module';

import { CreacionOcPage } from './creacion-oc.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CreacionOcPageRoutingModule
  ],
  declarations: [CreacionOcPage]
})
export class CreacionOcPageModule {}
