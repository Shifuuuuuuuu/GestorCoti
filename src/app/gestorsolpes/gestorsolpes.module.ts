import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GestorsolpesPageRoutingModule } from './gestorsolpes-routing.module';

import { GestorsolpesPage } from './gestorsolpes.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GestorsolpesPageRoutingModule
  ],
  declarations: [GestorsolpesPage]
})
export class GestorsolpesPageModule {}
