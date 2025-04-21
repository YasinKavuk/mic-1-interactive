import { Injectable } from '@angular/core';
import { RegProviderService } from '../reg-provider.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MainMemoryService {

  private memory: { [key: number]: number } = {}

  public systemCodeSize: number;
  public constantPoolSize: number;
  public inputBufferSize: number;
  public outputBufferSize: number;

  private _stackStartAddress = 0;

  private _updateMemory = new BehaviorSubject({address: 0, value: 0});
  public updateMemory$ = this._updateMemory.asObservable();

  constructor(
    private regProvider: RegProviderService,
  ) {
    this.inputBufferSize = 32
    this.outputBufferSize = 1024
  }

  public get stackStartAddress(): number {
    return this._stackStartAddress;
  }

  public emptyMemory(){
    this.memory = {}
    this.systemCodeSize = 0;
    this.constantPoolSize = 0;
    this.inputBufferSize = 32;
    this.outputBufferSize = 1024;
    this._stackStartAddress = 0;
  }

  public store_32(address: number, value: number, setter?: boolean) {

    console.log("change at address", address, "value:", value)

    // //check if we have permission to write in this area
    // if (!setter && (address < this.systemCodeSize + this.constantPoolSize)) {
    //   throw new Error("Segmentation fault - The area you are trying to write is read only");
    // }

    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer, 0);

    view.setInt32(0, value);

    this.memory[address + 0] = view.getUint8(0);
    this.memory[address + 1] = view.getUint8(1);
    this.memory[address + 2] = view.getUint8(2);
    this.memory[address + 3] = view.getUint8(3);

    this._updateMemory.next({ address: address, value: value});

    // this.printMemory()
  }

  public store_8(address: number, value: number) {
    this.memory[address] = value;
  }

  public get_32(address: number): number {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer, 0);

    view.setUint8(0, this.memory[address + 0]);
    view.setUint8(1, this.memory[address + 1]);
    view.setUint8(2, this.memory[address + 2]);
    view.setUint8(3, this.memory[address + 3]);

    return view.getInt32(0);
  }

  public get_8(address: number, intern?: boolean): number {
    if (address in this.memory) {
      return this.memory[address];
    }
    if (!intern) {
      console.warn(`no value at address: "${address}", returning 0`);
    }
    return 0;
  }

  public printMemory() {
    this.printSystemCode();
    this.printConstantArea();
    this.printInputBuffer();
    this.printOutputBuffer();
    this.printStack();
  }

  private printSystemCode() {
    console.group('%cSystemCode', 'color: green');
    console.log(`  Address     Value  `)
    for (let i = 0; i < this.systemCodeSize; i++) {
      console.log(`  ${this.dec2hex(i)}        0b${this.get_8(i, true).toString(2)} = ${this.get_8(i, true)}`)
    }
    console.groupEnd();
  }

  private printConstantArea() {
    console.group('%cConstantPool', 'color: blue');
    console.log(`  Address     Value  `)

    const start = this.regProvider.getRegister("CPP").getValue() * 4;
    for (let i = start; i < start + this.constantPoolSize; i += 4) {
      console.log(`  ${this.dec2hex(i)}        0b${this.get_32(i).toString(2)} = ${this.get_32(i)}`)
    }

    console.groupEnd();
  }

  public printInputBuffer() {
    console.group('%cInputBuffer', 'color: yellow');
    console.log(`  Address     Value  `);

    const start = this.regProvider.getRegister("CPP").getValue() * 4 + this.constantPoolSize;
    for (let i = start; i < start + this.inputBufferSize; i++) {
      console.log(`  ${this.dec2hex(i)}        0b${this.get_8(i, true).toString(2)} = ${this.get_8(i, true)}`);
    }
    console.groupEnd();
  }

  public printOutputBuffer() {
    console.group('%cOutputBuffer', 'color: orange');
    console.log(`  Address     Value  `);
    const start = this.regProvider.getRegister("CPP").getValue() * 4 + this.constantPoolSize + this.inputBufferSize;
    for (let i = start; i < start + this.outputBufferSize; i++) {
      console.log(`  ${this.dec2hex(i)}        0b${this.get_8(i, true).toString(2)} = ${this.get_8(i, true)}`);
    }
    for (let i = 4294967292-28; i < 4294967292+8; i++) {
      console.log(`  ${this.dec2hex(i)}        0b${this.get_8(i, true).toString(2)} = ${this.get_8(i, true)}`);
    }
    console.groupEnd();
  }


  private printStack() {
    console.group('%cGeneral Memory (Stack)', 'color: brown');
    console.log(`  Address     Value  `)

    let start = this.regProvider.getRegister("CPP").getValue() * 4 + this.constantPoolSize + this.inputBufferSize + this.outputBufferSize;
    let keys = Object.keys(this.memory).filter(address => parseInt(address) >= start).sort();

    for (let i = 0; i < keys.length; i += 4) {
      console.log(`  ${this.dec2hex(parseInt(keys[i]))}        0b${this.get_32(parseInt(keys[i])).toString(2)} = ${this.get_32(parseInt(keys[i]))}`)
    }

    console.groupEnd();
  }


  public dec2hex(number: number) {
    let prefix = "0x"
    if (number < 16) {
      prefix = prefix + "0"
    }
    return prefix + number.toString(16).toUpperCase();
  }

  public setCode(code: number[]) {
    this.systemCodeSize = code.length; // align next Memory Addresses

    this.regProvider.getRegister("MBR").setValue(code[0]); // Initialize MBR with first instruction

    for (let i = 0; i < code.length; i++) {
      this.store_8(i, code[i]);
    }
  }

  /**
   * !!! Before setConstants() must come setCode() !!!
   */
  public setConstants(constants: number[]) {
    this.constantPoolSize = constants.length * 4;
    let alignedSystemCodeSize = Math.ceil(this.systemCodeSize / 4) * 4;
    let inputBufferOffset = alignedSystemCodeSize + this.constantPoolSize;
    let outputBufferOffset = inputBufferOffset + this.inputBufferSize;


    this.regProvider.getRegister("CPP").setValue(alignedSystemCodeSize / 4); // set CPP to first constant
    for (let i = 0; i < constants.length; i++) {
      this.store_32(alignedSystemCodeSize + i * 4, constants[i], true); // constants start after the SystemCode
    }

    this._stackStartAddress = outputBufferOffset + this.outputBufferSize;

    // Set SP and LV to start of Stack
    this.regProvider.getRegister("SP").setValue(this._stackStartAddress / 4);
    this.regProvider.getRegister("LV").setValue(this._stackStartAddress / 4);

  }

  public createVariables(amount: number) {
    let start = (this.regProvider.getRegister("LV").getValue()) * 4;
    for (let i = 0; i < amount; i++) {
      this.store_32(start + i * 4, 0);
    }
    this.regProvider.getRegister("SP").setValue(this.regProvider.getRegister("SP").getValue() + amount);
  }

  public getMemory(){
    return this.memory;
  }

  pop13Stack() {
    const slicedMemory: { [key: number]: number } = {}

    const keys = Object.keys(this.memory).map(Number).sort((a, b) => a - b)

    const addressesToRemove = 52;
    const keepCount = Math.max(0, keys.length - addressesToRemove)

    const endAddressToKeep = keys[keepCount - 1]
    for (const key in this.memory) {
      const numericKey = Number(key);
      if (numericKey <= endAddressToKeep) {
        slicedMemory[numericKey] = this.memory[numericKey]
      }
    }

    this.memory = slicedMemory
  }

  public getLastUsedAddress(): number {
    const addresses = Object.keys(this.memory).map(Number);
    if (addresses.length === 0) return -1; // Return -1 if memory is empty

    // Return the maximum address using reduce for better performance with large memory
    return addresses.reduce((max, addr) => Math.max(max, addr), -1);
  }

  public getInputBufferContent(): number[]{
    let ib: number[] = []
    let startOfInput = this.systemCodeSize+this.constantPoolSize
    startOfInput += (4-(startOfInput % 4)) % 4
    console.log("start input: " + startOfInput)
    let endOfInput = startOfInput+this.inputBufferSize
    for(let i = startOfInput+3; i<endOfInput; i+=4){
      if(this.memory[i] !== undefined){
        ib.push(this.memory[i])
      }
    }
    console.log(ib)
    return ib
  }

  // public getOutputBufferContent(): number[] {
  //   let ob: number[] = []
  //   let startOfOutput = this.systemCodeSize + this.constantPoolSize + this.inputBufferSize
  //   startOfOutput += (4-(startOfOutput % 4)) % 4
  //   console.log("start output: " + startOfOutput)
  //   let endOfOutput = startOfOutput + this.outputBufferSize
  
  //   for (let i = startOfOutput + 3; i < endOfOutput; i += 4) {
  //     if (this.memory[i] !== undefined) {
  //       ob.push(this.memory[i])
  //     }
  //   }
  //   console.log(ob)
  //   return ob
  // }

  public getOutputBufferContent(): number[] {
    let ob: number[] = []
    let startOfOutput = this.systemCodeSize + this.constantPoolSize + this.inputBufferSize
    startOfOutput += (4 - (startOfOutput % 4)) % 4
    let endOfOutput = startOfOutput + this.outputBufferSize
  
    for (let i = startOfOutput; i < endOfOutput; i += 4) {
      const byte1 = this.memory[i]
      const byte2 = this.memory[i + 1]
      const byte3 = this.memory[i + 2]
      const byte4 = this.memory[i + 3]
  
      const value = (byte1 << 24) | (byte2 << 16) | (byte3 << 8) | byte4

      if(byte1 !== undefined && byte2 !== undefined && byte3 !== undefined && byte4 !== undefined){
        ob.push(value)
      }
    }
  
    return ob;
  }

}