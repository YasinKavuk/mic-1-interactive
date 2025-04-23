import { Component, OnInit } from '@angular/core';
import { MainMemoryService } from 'src/app/Model/Emulator/main-memory.service';
import { ConsoleService } from '../../Services/console.service';

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

  lastOutput = ""

  constructor(
    private consoleService: ConsoleService,
    private memory: MainMemoryService,
  ) { }

  ngOnInit(): void {
    this.memory.updateMemory$.subscribe(
      content => {
        let ibAsciiArr: number[] = this.memory.getInputBufferContent()
        this.input = ""
        for(let asciiCode of ibAsciiArr){
          this.input += String.fromCharCode(asciiCode)
          // this.input += asciiCode
        }
      }
    )

    this.consoleService.updateOutput$.subscribe(
      content => {
        let obArr: number[] = content.outputBufferContent
        this.output = obArr.map(value => String(value)).join(', ')
      }
    )
  }

  onInput(event: KeyboardEvent) {
    event.preventDefault() // Prevents the character from being inserted into the input field

    console.log("INPUT: ", event.key)

    switch (event.key) {
      case "Enter":
        this.consoleService.setKey("\r")
        break

      case "Backspace":
        this.consoleService.setKey("\b")
        break

      default:
        this.consoleService.setKey(event.key)
        break
    }
}

}
