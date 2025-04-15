import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditarSolpedsPageRoutingModule } from './editar-solpeds-routing.module';

import { EditarSolpedsPage } from './editar-solpeds.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EditarSolpedsPageRoutingModule
  ],
  declarations: [EditarSolpedsPage]
})
export class EditarSolpedsPageModule {}
