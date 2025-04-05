import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ShifterService {

  constructor() { }

  private _result: number;

  public get result(): number{
    return this._result;
  }

  private readonly operations: { [id: string] : {(a: number,):number} } = {
    "00": (a) => a << 0,  // No Shift
    "10": (a) => a << 8,  // SLL8 - Shift Left Logical
    "01": (a) => a >> 1,  // SRA1 - Shift Right Arithmetic
    "11": (a) => {throw new Error("ProtocolError - Shifter can only shift in one direction");}
  }

  /** 
   *  @param {[number,number]} operation - [SLL8, SRA1]
   *  @param {number} aluResult - Result from the previous Alu-Operation
  */
  public shift( operation: Array<number>, aluResult: number): number{
    if (operation.length != 2) {
      throw new Error("ProtocolError - Shifter-Operation must have 2 Bits but " + operation.length + " were given");
    }
    let op: string = operation.join("");
    this._result = this.operations[op](aluResult);
    

    // Print to Console
    // console.log(`Shifter Operation: ${op}
    // |  input:     ${aluResult},
    // |  function:  ${this.operations[op]},
    // |  result:    ${this._result}
    // `);

    return this._result;
  }

}
