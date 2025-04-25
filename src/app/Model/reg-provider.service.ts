import { Injectable } from '@angular/core';
import { Register } from './Registers';

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
                                  new Register("H", 0, 32),
                                  new Register("ISTR", 0, 32),
                                  new Register("IMR", 0, 32)]


  constructor() { }

  getRegisters(): Register[] {
    return this.registers.slice(0, this.registers.length - 2);
  }
  

  getRegister(name: String):Register{
    for(let register of this.registers){
      if(register.getName() === name){
        return register;
      }
    }
    return null;
  }

  getNonMemoryRegisters(): Register[]{
    const nonMemRegs = this.registers.filter(reg => reg.getName() !== "MDR" && reg.getName() !== "MBR")
    return nonMemRegs.slice(0, nonMemRegs.length - 2)
  }

  setRegister(name: String, value: number){
    for(let register of this.registers){
      if(register.getName() === name){
        register.setValue(value)
      }
    }
  }

}

