import { Injectable } from '@angular/core';
import { RegProviderService } from '../reg-provider.service';
import { BBusService } from './b-bus.service';

@Injectable({
  providedIn: 'root'
})
export class AluService {

  constructor(private regProvider:  RegProviderService, private busB: BBusService) {}

  private _n : boolean;
  private _z : boolean;
  private _result: number;

  private a : number;
  private b : number;

  public get result(): number{
    return this._result;
  }

  public get n(): boolean{
    return this._n;
  }

  public get z(): boolean{
    return this._z;
  }

  /** get the B-Bus value */
  private getB(): void{
    this.b = this.busB.getValue()
  }

  /** get the A-Bus value which in Mic-1 is the H Register */
  private getA(): void{
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer, 0);

    view.setUint32(0, this.regProvider.getRegister("H").getValue())

    if(this.busB.getRegName() === "MBRU"){
      this.a  = view.getInt16(2);
    }else{
      this.a  = view.getInt32(0);
    }
  }

  // dictionary of all available alu codes and corresponding functions
  private readonly operations: { [id: string] : {(a: number, b: number):number} } = {
    "011000": (a,b) => a,
    "010100": (a,b) => b,
    "011010": (a,b) => -a,
    "101100": (a,b) => -b,
    "111100": (a,b) => a + b,
    "111101": (a,b) => a + b + 1,
    "111001": (a,b) => a + 1,
    "110101": (a,b) => b + 1,
    "111111": (a,b) => b - a,
    "110110": (a,b) => b - 1,
    "111011": (a,b) => -a,
    "001100": (a,b) => a & b,   // Bitwise Operations convert numbers to 32-bit signed Integers
    "011100": (a,b) => a | b,
    "010000": (a,b) => 0,
    "110001": (a,b) => 1,
    "110010": (a,b) => -1,
  }

  /** @param operation - [F0,F1,ENA,ENB,INVA,INC]  */
  public calc(operation: Array<number>){
    if (operation.length != 6) {
      throw new Error("ProtocolError - Alu-Operation must have 6 Bits but " + operation.length + " were given");
    }

    this.a = undefined;

    // Check ENA and ENB
    if(operation[2]){ this.getA();}
    if(operation[3]){ this.getB();}

    // execute operation
    let op: string = operation.join("");
    this._result = this.operations[op](this.a,this.b)

    // set n and z flag
    this._z = this._result == 0;
    this._n = this._result < 0;

    // print on Console
    console.log(`Alu Operation: ${op}
    |  values:    [a: ${this.a}=0b${(this.a >>> 0).toString(2)}, b: ${this.b}=0b${(this.b >>> 0).toString(2)}],
    |  operation: ${this.operations[op]},
    |  flags:     [z: ${this._z}, n: ${this._n}],
    |  result:    ${this._result} = 0b${(this._result >>> 0).toString(2)}
    `);

    return [this._result, this.a];

  }

}
