import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-menu-oc',
  templateUrl: './menu-oc.page.html',
  styleUrls: ['./menu-oc.page.scss'],
})
export class MenuOcPage implements OnInit {
  nombreUsuario: string = '';

  constructor(
    private router: Router,
    private auth: AngularFireAuth,
    private firestore: AngularFirestore,
    private menu: MenuController
  ) {}

  async ngOnInit() {
    const user = await this.auth.currentUser;
    const uid = user?.uid;

    if (uid) {
      const userDoc = await this.firestore.collection('Usuarios').doc(uid).get().toPromise();
      if (userDoc?.exists) {
        const data = userDoc.data() as any;
        this.nombreUsuario = data?.fullName || '';
      }
    }
  }
  ionViewWillEnter() {
    this.menu.enable(true);
  }
  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
  }
}
