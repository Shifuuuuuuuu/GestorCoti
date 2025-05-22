import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GeneradorOcPageRoutingModule } from './generador-oc-routing.module';

import { GeneradorOcPage } from './generador-oc.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GeneradorOcPageRoutingModule
  ],
  declarations: [GeneradorOcPage]
})
export class GeneradorOcPageModule {}
