import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditarSolpedPageRoutingModule } from './editar-solped-routing.module';

import { EditarSolpedPage } from './editar-solped.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EditarSolpedPageRoutingModule
  ],
  declarations: [EditarSolpedPage]
})
export class EditarSolpedPageModule {}
