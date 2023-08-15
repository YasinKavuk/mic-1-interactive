import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DirectorService } from 'src/app/Presenter/director.service';
import { PresentationControllerService } from 'src/app/Presenter/presentation-controller.service';


interface Line {
  type: string;
  content: string;
}

@Component({
  selector: 'app-debug-console',
  templateUrl: './debug-console.component.html',
  styleUrls: ['./debug-console.component.scss']
})
export class DebugConsoleComponent implements OnInit, AfterViewChecked {
  @ViewChild("log") private log: ElementRef;

  public presentationMode = false;

  constructor(
    private director: DirectorService,
    private presentationController: PresentationControllerService,
  ) { }

  ngOnInit(): void {

    // toggle presentationMode
    this.presentationController.presentationMode$.subscribe( mode => {
      this.presentationMode = mode.presentationMode;
    })

    // log Micro Errors
    this.director.errorFlasher$.subscribe(
      error => {
        if (!error.error) { return };
        let content = "microcode:" + error.line + "\t->\t" + error.error;
        if (error.line == 1000){ content = "macrocode" + "\t -> \t" + error.error; }
        this.content.push({ type: "error", content: content });
      }
    )

    // log MacroErrors
    this.presentationController.errorFlasher$.subscribe(
      a => {
        if (!a.error) { return };
        this.content.push({ type: "error", content: a.content });
      }
    )

    // log Breakpoints
    this.director.breakpointFlasher$.subscribe(
      breakpoint => {
        if (!breakpoint.line) { return };
        this.content.push({ type: "info", content: "microcode \t->\t Hit Breakpoint in line " + breakpoint.line })
      }
    )

    // log reset Event
    this.director.consoleNotifier$.subscribe(
      content => {
        if (!content) { return };
        this.clearConsole();
        this.content.push({type: "success", content: content })
      }
    )


  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  public content: Line[] = [];


  private scrollToBottom() {
    try {
      this.log.nativeElement.scrollTop = this.log.nativeElement.scrollHeight;
    } catch (err) { }
  }

  private clearConsole(){
    this.content = [];
  }


}
