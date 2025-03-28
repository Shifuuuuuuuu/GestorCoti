import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-menu-solpe',
  templateUrl: './menu-solpe.page.html',
  styleUrls: ['./menu-solpe.page.scss'],
})
export class MenuSolpePage implements OnInit {
  cotizacionesPendientesCount: number = 0;
  comparacionesPendientesCount: number = 0;
  cotizacionesAceptadasCount: number = 0;
  comparacionesAceptadasCount: number = 0;
  totalAceptadas: number = 0;

  usuario = {};

  constructor(
    private router: Router,
    private menu: MenuController
  ) {}

  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
  }
  ionViewWillEnter() {
    this.menu.enable(true);
  }

  ngOnInit() {

  }


}
