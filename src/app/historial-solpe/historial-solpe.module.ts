import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HistorialSolpePageRoutingModule } from './historial-solpe-routing.module';

import { HistorialSolpePage } from './historial-solpe.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HistorialSolpePageRoutingModule
  ],
  declarations: [HistorialSolpePage]
})
export class HistorialSolpePageModule {}
