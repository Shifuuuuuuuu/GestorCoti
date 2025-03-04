import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ComparacionesPageRoutingModule } from './comparaciones-routing.module';

import { ComparacionesPage } from './comparaciones.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ComparacionesPageRoutingModule,
  ],
  declarations: [ComparacionesPage],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ComparacionesPageModule {}
