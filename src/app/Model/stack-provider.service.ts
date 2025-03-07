import { Injectable } from '@angular/core';
import { MainMemoryService } from './Emulator/main-memory.service';
import { RegProviderService } from './reg-provider.service';

@Injectable({
  providedIn: 'root'
})
export class StackProviderService  {

  constructor(
    private mainMemory: MainMemoryService,
    private regProvider: RegProviderService,
    ){}

  private _sp: number = 0;
  private _lv: number = 0;

  private _items: [number,number][] = [];

  public get items() : [number,number][]  {
    return [...this._items];
  }





  public update(){
    this._items = [];
    let size = (this.mainMemory.stackStartAddress - this.regProvider.getRegister("SP").getValue() * 4);
    for(let i = this.mainMemory.stackStartAddress; i <= this.regProvider.getRegister("SP").getValue() * 4; i += 4){
      this._items.push([i,this.mainMemory.get_32(i)]);
    }
  }

  public pop13(){
    this._sp -= 13
    return this._items.splice(this._items.length - 13, 13)
  }

  public growStackframe(addValue: number){
    console.log("current SP: ", this._sp)
    this._sp += 4 * addValue
    console.log("new SP: ", this._sp)
  }


}
