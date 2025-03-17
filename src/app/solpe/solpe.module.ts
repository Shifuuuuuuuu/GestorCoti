import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SolpePageRoutingModule } from './solpe-routing.module';

import { SolpePage } from './solpe.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SolpePageRoutingModule
  ],
  declarations: [SolpePage]
})
export class SolpePageModule {}
