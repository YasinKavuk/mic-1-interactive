import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConsoleService {
  private key: number = undefined

  constructor() { }

  fetchKey(){
    console.log("fetch key")
    return this.key
  }

  setKey(key: string){
    console.log("set key: ", key)
    this.key = key.charCodeAt(0)
  }
}
