import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Deeplinks } from '@ionic-native/deeplinks';

import { HomePage } from '../pages/home/home';

import { Auth } from '../providers/auth';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage = HomePage;

  constructor(private platform: Platform, private statusBar: StatusBar, private splashScreen: SplashScreen, private deeplinks: Deeplinks, private auth: Auth) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();

      // Add the deeplinks for authentication
      deeplinks.route({
         '/callback': 'authCallback'
      }).subscribe((match) => {
         if (match.$route === "authCallback") {
             this.auth.handleCallback(match);
         } else {
             console.warn("Match ignored.", match);
         }
     }, (nomatch) => {
         if (nomatch.$link.host === "callback") {
             this.auth.handleCallback(nomatch);
         } else {
             console.warn("Path not found while using deeplinks.", nomatch)
         }
     });
    });
  }
}
