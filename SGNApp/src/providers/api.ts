import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import 'rxjs/add/operator/map';

import { Auth } from './auth';

@Injectable()
export class Api {

  constructor(private http: Http, private auth: Auth) {
  }

  public get(endpoint: string, getParams: Array<string> = null): Promise<any> {
      return new Promise((resolve, reject) => {
          this.auth.login().then(data => {
              this.getSecure(endpoint, getParams, data).then(success => resolve(success), error => reject(error));
          }, error => {
              reject("De gebruiker kan niet worden ingelogd. De request is gecanceled");
          });
      });
  }

  private getSecure(endpoint: string, getParams: Array<string> = null, credentials: any): Promise<any> {
      return new Promise((resolve, reject) => {
          const url = 'https://test.sgndata.nl/backend/' + endpoint;

          var headers = new Headers();
          headers.append('Authorization', 'Bearer ' + credentials.access_token);

          this.http.get(url, {headers: headers}).map(res => res.json())
          .subscribe(res => {
              resolve(res);
          }, err => {
              // Detecteer of het een 401 fout was, zodat je een nieuw token kan ophalen
              if (err.status === 401) {
                  this.auth.refreshToken().then(credentials => {
                      var headers = new Headers();
                      headers.append('Authorization', 'Bearer ' + credentials.access_token);

                      this.http.get(url, {headers: headers}).map(res => res.json())
                      .subscribe(res => {
                          resolve(res);
                      }, err => {
                          reject(err);
                      });
                  }, err => {
                    console.log("Je sessie is verlopen en we kunnen je niet opnieuw inloggen. De request is gecanceled.");
                    reject();
                  });
              } else {
                  reject(err);
              }
          });
      });
  }
}
