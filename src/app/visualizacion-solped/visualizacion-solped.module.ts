import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VisualizacionSolpedPageRoutingModule } from './visualizacion-solped-routing.module';

import { VisualizacionSolpedPage } from './visualizacion-solped.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VisualizacionSolpedPageRoutingModule
  ],
  declarations: [VisualizacionSolpedPage]
})
export class VisualizacionSolpedPageModule {}
