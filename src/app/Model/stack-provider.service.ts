import { Injectable } from '@angular/core';
import { MainMemoryService } from './Emulator/main-memory.service';
import { RegProviderService } from './reg-provider.service';
import { DirectorService } from '../Presenter/director.service';

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

  public pop12(){
    this._sp -= 12
    return this._items.splice(this._items.length - 12, 12)
  }

  public growStackframe(addValue: number){
    console.log("current SP: ", this._sp)
    this._sp += 4 * addValue
    console.log("new SP: ", this._sp)
  }


}
