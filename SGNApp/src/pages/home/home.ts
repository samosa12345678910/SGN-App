import { Component } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
import { Auth } from '../../providers/auth';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController, private platform : Platform, public auth : Auth) {

  }

  public login() {
      this.platform.ready().then(() => {
        this.auth.login().then(success => {
            alert(success);
        }, (error) => {
            alert(error);
        });
    });
  }

}
