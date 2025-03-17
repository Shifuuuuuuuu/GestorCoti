import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CertificadosMantencionesPageRoutingModule } from './certificados-mantenciones-routing.module';

import { CertificadosMantencionesPage } from './certificados-mantenciones.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CertificadosMantencionesPageRoutingModule
  ],
  declarations: [CertificadosMantencionesPage]
})
export class CertificadosMantencionesPageModule {}
