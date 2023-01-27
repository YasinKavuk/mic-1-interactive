import { Injectable } from '@angular/core';
import { Register } from '../Model/Registers';

@Injectable({
  providedIn: 'root'
})
export class RegProviderService {
  private registers: Register[] = [new Register("PC", 0, 32),
                                  new Register("MAR", 0, 32),
                                  new Register("MDR", 0, 32),
                                  new Register("MBR", 0, 32),
                                  new Register("SP", 0, 32),
                                  new Register("LV",0,32),
                                  new Register("CPP", 0, 32),
                                  new Register("TOS", 0, 32),
                                  new Register("OPC", 0, 32),
                                  new Register("H", 0, 32)] 


  constructor() { }

  getRegisters():Register[]{
    return this.registers;
  }

  getRegister(name: String):Register{
    for(let register of this.registers){
      if(register.getName() === name){
        return register;
      }
    }
    return null;
  }
}

