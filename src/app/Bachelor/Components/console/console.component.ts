import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { isNumber } from 'cypress/types/lodash';

@Component({
  selector: 'app-console',
  templateUrl: './console.component.html',
  styleUrls: ['./console.component.css']
})
export class ConsoleComponent implements OnInit {
  input: string = `` //memory-mapped to input-buffer in the system memory
  output: string = `` //memory-mapped to output-buffer in the system memory
  outputHistory: string = ``
  inputBufferDevice: Uint8Array[] = []

  constructor() { }

  ngOnInit(): void {
  }

  onInput(event: KeyboardEvent){
    event.preventDefault() // stops the character from beeing inserted in the input-field

    const key = event.key
    

    // put utf8 into the inputBufferDevice and than continue with the interrupt. slice array with (0,1). repeat when array is not empty.
    // how to handle 2byte operands like 167 -5 (167 is goto, -5 would be 2 byte. When its not negative its still 2 bytes.) Maybe flag? like 167 -4 oder 167 +4.
    // trigger interrupt and pass this key into an register while contex switching
  }
}
