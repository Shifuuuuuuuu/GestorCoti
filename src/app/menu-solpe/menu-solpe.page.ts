import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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
  ) {}

  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
  }

  ngOnInit() {

  }


}
