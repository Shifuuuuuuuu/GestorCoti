import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-creacion-oc',
  templateUrl: './creacion-oc.page.html',
  styleUrls: ['./creacion-oc.page.scss'],
})
export class CreacionOcPage implements OnInit {
  modoSeleccionado: string = 'Creacion_OC';
  constructor() { }

  ngOnInit() {
  }

}
