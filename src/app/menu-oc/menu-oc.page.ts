import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu-oc',
  templateUrl: './menu-oc.page.html',
  styleUrls: ['./menu-oc.page.scss'],
})
export class MenuOcPage implements OnInit {

  constructor(private router: Router,) { }

  ngOnInit() {
  }

  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
  }

}
