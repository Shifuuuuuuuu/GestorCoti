import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MenuSolpePageRoutingModule } from './menu-solpe-routing.module';

import { MenuSolpePage } from './menu-solpe.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MenuSolpePageRoutingModule
  ],
  declarations: [MenuSolpePage]
})
export class MenuSolpePageModule {}
