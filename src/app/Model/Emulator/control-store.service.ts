import { Token } from '../micro-tokenizer.service';
import { Injectable } from '@angular/core';
import { ParserService, Instruction, Line } from 'src/app/Model/Emulator/parser.service';
import { MicroProviderService } from '../micro-provider.service';

@Injectable({
  providedIn: 'root'
})
export class ControlStoreService {
  private microAddr:{ [instruction: string] : number } = {};
  private micro:{ [address: number] : Line };

  constructor(
    private microParser: ParserService,
    private microProvider: MicroProviderService,
    ) { }

  loadMicro(){
    this.microParser.labels = {};
    this.micro = this.microParser.index(this.microProvider.getMicro().split('\n'));
    this.microAddr = this.microParser.labels;
  }

  getMicroAddr(){
    return this.microAddr;
  }

  getMicro(){
    return this.micro;
  }

}
