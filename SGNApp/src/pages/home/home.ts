import { Component } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
import { Auth } from '../../providers/auth';
import { Api } from '../../providers/api';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

    public response;

  constructor(public navCtrl: NavController, private platform : Platform, public auth : Auth, public api: Api) {
  }

  /**
   * TIJDELIJKE CODE VOOR DEMONSTRATIE. DEZE PAGINA WORDT UITEINDELIJK VERWIJDERD EN DIENT TE WORDEN VERVANGEN DOOR EEN ROOSTERPAGINA.
   */

  public login() {
      this.platform.ready().then(() => {
        this.auth.login().then(() => {
            alert("Logged in");
        }, (error) => {
            alert(error);
        });
    });
  }

  public getCreds() {
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

  public getTest() {
      this.api.get('leerlingen/113004').then(success => {
          console.log(success);
          this.response = success;
      }, error => {
          console.log(error);
      });
  }
}
