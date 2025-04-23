import { Component, OnInit } from '@angular/core';
import { ConsoleService } from '../../Services/console.service';

@Component({
  selector: 'app-console',
  templateUrl: './console.component.html',
  styleUrls: ['./console.component.css']
})
export class ConsoleComponent implements OnInit {
  input: string = ``
  output: string = ``
  outputHistory: string = ``

  lastOutput = ""

  constructor(
    private consoleService: ConsoleService,
  ) { }

  ngOnInit(): void {
    this.consoleService.updateInput$.subscribe(
      content => {
        let ibAsciiArr: number[] = content.inputBufferContent
        this.input = ""
        for(let asciiCode of ibAsciiArr){
          this.input += String.fromCharCode(asciiCode)
        }
      }
    )

    this.consoleService.updateOutput$.subscribe(
      content => {
        let obArr: number[] = content.outputBufferContent
        this.output = obArr.map(value => String(value)).join(', ')

        if(content.saveToHistory){
          this.outputHistory += this.output + '\n'
        }
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
