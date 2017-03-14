import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';

import 'rxjs/add/operator/map';

import URL from 'url-parse';
import queryString from 'query-string';

declare var window: any;

@Injectable()
export class Auth {

  constructor(private http: Http) {
  }

  public login(): Promise<any> {
      return new Promise((resolve, reject) => {
          const clientId = "b8ef7e9a-071f-4f5f-b826-4d6d160fbe97";
          const authContextUrl = "https://login.microsoftonline.com/stedelijkgymnijmegen.nl";
          const resourceUrl = "https://graph.windows.net";

          const state = Math.random().toString(36).substr(2, 10);
          const nonce = Math.random().toString(36).substr(2, 10);

          var browserRef = window.cordova.InAppBrowser.open(authContextUrl + "/oauth2/authorize?client_id=" + clientId + "&redirect_uri=http://SGNApp&response_type=code&scope=openid,email,profile&resource=" + resourceUrl + "&state=" + state + "&nonce=" + nonce, "_blank", "location=no,clearsessioncache=yes,clearcache=yes,zoom=no");
          browserRef.addEventListener("loadstart", (event) => {
              if ((event.url).indexOf("http://sgnapp") === 0) {
                  browserRef.removeEventListener("exit", (event) => {});
                  browserRef.close();

                  const url = new URL(event.url);
                  const query = queryString.parse(url.query);

                  if (query.error !== undefined) {
                      reject(query.error);
                  }

                  if (query.state !== state) {
                      reject('Authentication error. State incorrect.');
                  } else {
                      // State correct!
                      const code = query.code;
                      let data = {
                              client_id: clientId,
                              grant_type: 'authorization_code',
                              code: code,
                              redirect_uri: 'http://SGNApp',
                              resource: resourceUrl
                      };

                      var headers = new Headers();
                      headers.append('Content-Type', 'application/x-www-form-urlencoded');

                      // TODO:: DEAL WITH CORS ISSUES
                      this.http.post('microsoft/oauth2/token', queryString.stringify(data), {headers: headers}).map(res => res.json())
                      .subscribe(res => {
                          const token = res.id_token;

                          let data = {
                            id_type: 'azure_ad',
                            id_token: token
                          };

                          this.http.post('https://test.sgndata.nl/backend/auth/authorize', queryString.stringify(data), {headers: headers}).map(res => res.json())
                          .subscribe(res => {
                              console.log(res);
                              resolve('Logged in!');
                          }, err => {
                              console.log(err);
                              reject('Failed getting details from test.sgndata.nl');
                          });
                      }, err => {
                          console.log(err);
                          reject('Failed getting details from Microsoft');
                      });
                  }
              }
          });
      });
  }

  public setCredentials() {

  }
}
