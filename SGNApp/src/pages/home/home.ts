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
            alert("Logged in");
        }, (error) => {
            alert(error);
        });
    });
  }

  public get() {
      this.auth.getCredentials().then(success => {
          console.log(success);
      }, error => {
          alert("No user found");
      });
  }

  public logout() {
      this.auth.logout().then(success => {
          alert("Logged out!");
      }, error => {
          alert("No user found");
      });
  }
}
