import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RegProviderService } from 'src/app/Model/reg-provider.service';

@Injectable({
  providedIn: 'root'
})
export class ConsoleService {
  private key: number = undefined

  private input: number[] = []
  private output: number[] = []

  private _updateInput = new BehaviorSubject({inputBufferContent: []});
  public updateInput$ = this._updateInput.asObservable();

  private _updateOutput = new BehaviorSubject({outputBufferContent: [], saveToHistory: false});
  public updateOutput$ = this._updateOutput.asObservable();

  constructor(
    private regProvider: RegProviderService
  ) { }

  fetchKey(){
    console.log("fetch key")
    return this.key
  }

  setOutput(char: number){
    this.output.push(char)
    this._updateOutput.next({outputBufferContent: this.output, saveToHistory: false})
  }

  emptyIO(){
    if(this.output.length > 0){
      this._updateOutput.next({outputBufferContent: [...this.output], saveToHistory: true})
    }
    this.input = []
    this.output = []
    this._updateOutput.next({outputBufferContent: this.output, saveToHistory: false})
    this._updateInput.next({inputBufferContent: this.input})
  }

  setInput(char: number){
    this.input.push(char)
    this._updateInput.next({inputBufferContent: this.input})
  }

  backspaceOnInput(){
    this.input.pop()
    this._updateInput.next({inputBufferContent: this.input})
  }

  setKey(key: string){
    console.log("set key: ", key)
    this.key = key.charCodeAt(0)

    if(this.key == 13){
      this.triggerInterrupt(3)
    }
    else if(this.key == 8){
      this.triggerInterrupt(2)
    }
    else{
      this.triggerInterrupt(1)
    }
  }

  triggerInterrupt(intVec: number){
    this.regProvider.setRegister("ISTR", intVec)
  }
}
