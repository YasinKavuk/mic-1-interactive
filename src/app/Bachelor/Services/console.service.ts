import { Injectable } from '@angular/core';
import { RegProviderService } from 'src/app/Model/reg-provider.service';

@Injectable({
  providedIn: 'root'
})
export class ConsoleService {
  private key: number = undefined

  constructor(
    private regProvider: RegProviderService
  ) { }

  fetchKey(){
    console.log("fetch key")
    return this.key
  }

  setKey(key: string){
    console.log("set key: ", key)
    this.key = key.charCodeAt(0)

    if(this.key == 13){
      this.attachInterrupt(3)
    }
    else if(this.key == 8){
      this.attachInterrupt(2)
    }
    else{
      this.attachInterrupt(1)
    }
  }

  attachInterrupt(intVec: number){
    this.regProvider.setRegister("ISR", intVec)
  }
}
