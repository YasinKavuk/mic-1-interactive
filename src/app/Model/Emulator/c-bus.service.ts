import { Injectable } from '@angular/core';
import { RegProviderService } from '../reg-provider.service';

export interface CBusResult{
  registers: string[];
  value: number;
}


@Injectable({
  providedIn: 'root'
})

export class CBusService {

  private _writtenRegisters: string[] = [];

  public get writtenRegisters(): string[]{
    return this._writtenRegisters;
  }

  // all Register that can be written by the C-Bus (ordered according to Tannenbaum)
  private readonly registers: string[] = [
    "H",
    "OPC",
    "TOS",
    "CPP",
    "LV",
    "SP",
    "PC",
    "MDR",
    "MAR",
  ]

  constructor(private regProvider: RegProviderService) {}

  public activate(operation: number[], value: number ): CBusResult{
    if (operation.length != 9) {
      throw new Error("ProtocolError - C-Bus-Operation must have 9 Bits but " + operation.length + " were given");
    }

    // reset written registers
    this._writtenRegisters = [];

    // if a Register is selected -> write the given value
    for(let i = 0; i < operation.length; i++){
      if (operation[i]) {
        this.regProvider.getRegister(this.registers[i]).setValue(value);
        this._writtenRegisters.push(this.registers[i]);
      }
    }

    // Print to Console
    console.log(`C-Bus Operation: ${operation.join("")}
    |  write value:   ${value},
    |  to Registers:  ${this._writtenRegisters}
    `);

    return {registers: this._writtenRegisters, value: value};
  }
}
