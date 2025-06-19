import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu-ordenes',
  templateUrl: './menu-ordenes.page.html',
  styleUrls: ['./menu-ordenes.page.scss'],
})
export class MenuOrdenesPage implements OnInit {

  constructor(private router: Router,) { }

  ngOnInit() {
  }

  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
  }

}
