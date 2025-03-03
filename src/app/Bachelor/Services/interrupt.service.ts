import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AluService } from 'src/app/Model/Emulator/alu.service';
import { MainMemoryService } from 'src/app/Model/Emulator/main-memory.service';
import { RegProviderService } from 'src/app/Model/reg-provider.service';
import { StackProviderService } from 'src/app/Model/stack-provider.service';

@Injectable({
  providedIn: 'root'
})
export class InterruptService {
  contextOrder: string[] = ["PC", "MAR", "MDR", "MBR", "SP", "LV", "CPP", "TOS", "OPC", "H"]

  constructor(
    private regProvider: RegProviderService, 
    private stackProvider: StackProviderService,
    private mainMemory: MainMemoryService,
    private alu: AluService,
  ) { }

  private setRegisterValuesSource = new BehaviorSubject([]);
  public setRegisterValues = this.setRegisterValuesSource.asObservable();


  triggerInterrupt(key: string){
    console.log("--INTERRUPT--, " + key)
    // check statusbit for blocking interrupts
    // ...

    // save context (push registers to the stack)
    let regValues = this.regProvider.getRegisters()
    const lastUsedAddr = this.mainMemory.getLastUsedAddress()

    let addr = lastUsedAddr + 1
    for(let i = 0; i < regValues.length; i++){
      console.log(regValues[i].getName())
      this.mainMemory.store_32(addr, regValues[i].getValue());
      addr += 4
    }
    this.mainMemory.store_32(addr, Number(this.alu.n))
    this.mainMemory.store_32(addr+4, Number(this.alu.z))

    let newSP = this.regProvider.getRegister("SP").getValue() + 12
    this.setRegisterValuesSource.next(["SP", newSP, false]);
    this.regProvider.setRegister("SP", newSP)
    this.stackProvider.update()

    // context swtich (jump to ISR)
    // ...

    // Does not return the Context here
  }

  returnContext(){
    console.log("--RETURNING CONTEXT--")
    const oldState = this.stackProvider.pop12() // get old register and ALU values for contex restoring
    this.mainMemory.pop12Stack() // needed to update Stack-View in the emulator not critical
    this.stackProvider.update()

    // returns registers and alu to old context
    for(let i = 0; i < oldState.length; i++){
      this.regProvider.setRegister(this.contextOrder[i], oldState[i][1])
    }
    this.alu.setN(Boolean(oldState[10][1]))
    this.alu.setZ(Boolean(oldState[11][1]))

  }
}
