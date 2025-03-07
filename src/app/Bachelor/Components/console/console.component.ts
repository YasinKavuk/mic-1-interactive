import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DirectorService } from 'src/app/Presenter/director.service';

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

  constructor(
    private director: DirectorService, 
  ) { }

  ngOnInit(): void {
  }

  onInput(event: KeyboardEvent){
    event.preventDefault() // stops the character from beeing inserted in the input-field

    const key = event.key
    this.director.triggerInterrupt(key)
    
  }
}
