import { Injectable } from '@angular/core';
import { Microprogramms } from '../../assets/Microprogramms/Microprograms';

@Injectable({
  providedIn: 'root'
})
export class MicroProviderService {
  microprogramms: Microprogramms = new Microprogramms();
  micro: string = this.microprogramms.getMicro();

  microGotChanged: boolean = false;

  constructor() {
    const code = localStorage.getItem("microCode");
    if (code){
      this.micro = code;
    }
   }

  //Is called when the User presses the export button
  setMicro(micro: string) {
    this.micro = micro;
    localStorage.setItem("microCode", this.micro);
  }

  getMicro() {
    return this.micro;
  }

  resetMicro() {
    this.micro = this.microprogramms.getMicro();
  }

  isLoaded(){
    this.microGotChanged = false;
  }

  getMicroGotChanged(){
    return this.microGotChanged;
  }
}
