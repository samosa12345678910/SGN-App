import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { NativeStorage } from '@ionic-native/native-storage';
import { BrowserTab } from '@ionic-native/browser-tab';
import { InAppBrowser } from '@ionic-native/in-app-browser';

import 'rxjs/add/operator/map';

import queryString from 'query-string';

declare var window: any;

@Injectable()
export class Auth {

  private loginResolve: any;
  private loginReject: any;
  private loginData: any;

  constructor(private http: Http, private nativeStorage: NativeStorage, private browserTab: BrowserTab, private browser: InAppBrowser) {
  }

  /**
   * Login functions
   * Gebruik altijd login() en niet forceLogin.
   */
  public login(): Promise<any> {
      return new Promise((resolve, reject) => {
          this.getCredentials().then(res => {
              resolve(res);
          }, error => {
              this.forceLogin().then(res => resolve(res), err => reject(err));
          });
      });
  }

  private forceLogin(): Promise<any> {
      return new Promise((resolve, reject) => {
          const clientId = "b8ef7e9a-071f-4f5f-b826-4d6d160fbe97";
          const authContextUrl = "https://login.microsoftonline.com/stedelijkgymnijmegen.nl";
          const resourceUrl = "https://graph.windows.net";

          if (window.cordova !== undefined) {
              this.loginNativeFlow(clientId, authContextUrl, resourceUrl, resolve, reject);
          } else {
              alert("Whoops, we hebben nog geen browsersupport.");
          }
      });
  }

  private loginNativeFlow(clientId: string, authContextUrl: string, resourceUrl: string, resolve: any, reject: any) {
      const state = Math.random().toString(36).substr(2, 10);
      const nonce = Math.random().toString(36).substr(2, 10);
      const redirectUrl = "sgn://callback";

      this.loginResolve = resolve;
      this.loginReject = reject;
      this.loginData = {
          state,
          nonce,
          clientId,
          authContextUrl,
          resourceUrl,
          redirectUrl
      };

      // Automatic timeout after 60 seconds.
      setTimeout(() => {
          if (this.loginReject !== null) {
            console.warn("The response took too long and a timeout response was sent.");
            this.sendLoginResponse(false, "Timeout.");
          }
      }, 60000);

      const url = authContextUrl + "/oauth2/authorize?client_id=" + clientId + "&redirect_uri=" + redirectUrl + "&response_type=code&scope=openid,email,profile&resource=" + resourceUrl + "&state=" + state + "&nonce=" + nonce;

      this.browserTab.isAvailable()
        .then((isAvailable: boolean) => {
            if (isAvailable) {
                this.browserTab.openUrl(url);
            } else {
                this.browser.create(url, '_system', {});
            }
        });
  }

  private sendLoginResponse(success: boolean, message: string) {
      if (this.loginResolve !== null) {
          if (success) {
              this.loginResolve(message);
          } else {
              this.loginReject(message);
          }


          // Cleanup
          this.loginResolve = null;
          this.loginReject = null;
          this.loginData = null;
      }
  }

  public handleCallback(routeMatch: any) {
      if (this.loginData === null || this.loginData === undefined) {
          console.warn("Incorrect auth callback. There was no login promise to answer to.");
          return;
      }

      console.log('Processing login data', routeMatch);

      const query = queryString.parse(routeMatch.$link.queryString);

      // Check of de respnose een error attr bevat
      if (query.error !== undefined) {
        this.sendLoginResponse(false, "Het inloggen is mislukt: " + query.error);
      }

      // Check of de state oke is en of er een code is geretourneerd.
      if (query.state !== this.loginData.state) {
        this.sendLoginResponse(false, 'Authentication error. State incorrect.');
      } else if (query.code !== undefined) {
        // State correct!
        const code = query.code;
        let data = {
            client_id: this.loginData.clientId,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: this.loginData.redirectUrl,
            resource: this.loginData.resourceUrl
        };

        /**
        * TIJDELIJK:
            Stuur een request naar het token endpoint bij microsoft om de code op te halen, en stuur deze daarna door naar de SGN API server.
            Dit wordt vervangen door een OAuth flow op de SGN API server.
        */

        var headers = new Headers();
        headers.append('Content-Type', 'application/x-www-form-urlencoded');

        this.http.post('https://login.microsoftonline.com/stedelijkgymnijmegen.nl/oauth2/token', queryString.stringify(data), {headers: headers}).map(res => res.json())
            .subscribe(res => {
                const token = res.id_token;
                let data = {
                    id_type: 'azure_ad',
                    id_token: token
                };

                this.http.post('https://test.sgndata.nl/backend/auth/authorize', queryString.stringify(data), {headers: headers}).map(res => res.json())
                    .subscribe(res => {
                        this.setCredentials(res).then(
                            data => {
                                this.sendLoginResponse(true, res);
                            }, error => {
                                this.sendLoginResponse(false, "Failed saving the credentials.");
                            }
                        )
                    }, err => {
                        console.log(err);
                        this.sendLoginResponse(false, 'Failed getting details from test.sgndata.nl');
                    });
                }, err => {
                    // TEMP:: Fix CORS issue
                    console.warn("Er was nu normaal een CORS issue opgetreden, maar de onderstaande code gaat dat tijdelijk tegen met een lokale proxy.");

                    this.http.post('microsoft/oauth2/token', queryString.stringify(data), {headers: headers}).map(res => res.json())
                    .subscribe(res => {
                        const token = res.id_token;
                        let data = {
                            id_type: 'azure_ad',
                            id_token: token
                        };

                        this.http.post('https://test.sgndata.nl/backend/auth/authorize', queryString.stringify(data), {headers: headers}).map(res => res.json())
                        .subscribe(res => {
                            this.setCredentials(res).then(
                                data => {
                                    this.sendLoginResponse(true, res);
                                }, error => {
                                    this.sendLoginResponse(false, "Failed saving the credentials.");
                                }
                            );
                        }, err => {
                            console.log(err);
                            this.sendLoginResponse(false, 'Failed getting details from test.sgndata.nl');
                        });
                    });
                });

            /**
            * EINDE TIJDELIJKE BLOK
            */
      } else {
          this.sendLoginResponse(false, 'Het inloggen is mislukt.');
      }
  }

  /**
   * Credentials functions
   */

  public setCredentials(res: any): Promise<any> {
      return new Promise((resolve, reject) => {
          this.nativeStorage.setItem('sgnCredentials', res)
          .then(
            () => resolve(),
            error => {
                reject(error);
            }
          );
      });
  }


  // Je kunt beter login() gebruiken ipv deze functie. Als je login() gebruikt heb je ook meteen de login fallback. Let wel op dat de credentials verlopen kunnen zijn.
  public getCredentials(): Promise<any> {
      return new Promise((resolve, reject) => {
          this.nativeStorage.getItem('sgnCredentials')
          .then(
            data => resolve(data),
            error => {
                reject(error);
            }
          );
      });
  }

  public logout(): Promise<any> {
      return new Promise((resolve, reject) => {
          this.getCredentials().then(() => {
              this.nativeStorage.remove('sgnCredentials')
              .then(
                () => resolve(),
                error => {
                    reject(error);
                }
              );
          }, error => {
              reject(error);
          });
      });
  }

  /**
   * Refresh functions
   */

  public refreshToken(): Promise<any> {
      return new Promise((resolve, reject) => {
         this.getCredentials().then(creds => {
             let data = {
               id_type: 'refresh_token',
               refresh_token: creds.refresh_token
             };

             var headers = new Headers();
             headers.append('Content-Type', 'application/x-www-form-urlencoded');

             this.http.post('https://test.sgndata.nl/backend/auth/authorize', queryString.stringify(data), {headers: headers}).map(res => res.json())
             .subscribe(res => {
                 this.setCredentials(res).then(
                     data => {
                         resolve(res);
                     }, error => {
                         console.log("Failed saving the credentials");
                         reject();
                     }
                 )
             }, err => {
                 this.forceLogin().then(success => {
                     resolve(success);
                 }, err => {
                     console.log("Auth error", err);
                     reject();
                 });
             });
         }, err => {
            console.log("Er zijn geen credentials gevonden, maar je roept toch deze functie aan?");
            reject();
         });
      });
  }
}
