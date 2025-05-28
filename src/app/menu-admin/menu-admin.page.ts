import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu-admin',
  templateUrl: './menu-admin.page.html',
  styleUrls: ['./menu-admin.page.scss'],
})
export class MenuAdminPage implements OnInit {

  constructor(private router: Router,) { }

  ngOnInit() {
  }

  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
  }

}
