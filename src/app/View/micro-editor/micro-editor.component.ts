import { AfterViewInit, Component, ElementRef, ViewChild, ɵɵqueryRefresh } from "@angular/core";
import { ControllerService } from "src/app/Presenter/controller.service";
import * as ace from "ace-builds";
import { DirectorService } from "src/app/Presenter/director.service";
import { timer } from "rxjs";
import { ThemeControlService } from "src/app/Presenter/theme-control.service";
import { PresentationControllerService } from "src/app/Presenter/presentation-controller.service";


const LANG = "ace/mode/micro";
const THEME_LIGHT = "ace/theme/eclipse";
const THEME_DARK = "ace/theme/gruvbox";
const defaultMicro = `Main1: PC=PC+1; fetch; goto(MBR)

(0x00)NOP:; goto Main1

(0x10)BIPUSH: SP=MAR=SP+1;
    PC=PC+1; fetch
    MDR=TOS=MBR; wr; goto Main1;

(0x13)ISUB: MAR=SP=SP-1; rd
    H=TOS
    MDR=TOS=MDR-H; wr; goto Main1

(0x16)IAND: MAR=SP=SP-1; rd
    H=TOS
    MDR=TOS=MDR AND H; wr; goto Main1

(0x02)IOR:MAR=SP=SP-1; rd
    H=TOS
    MDR=TOS=MDR OR H; wr; goto Main1

(0x05)DUP: MAR = SP = SP+1
    MDR=TOS;wr;goto Main1

(0x57)POP: MAR=SP=SP-1; rd;
    pop1:   //wait
    TOS=MDR;goto Main1

(0x19)SWAP: MAR=SP-1; rd;
    MAR=SP
    H=MDR;wr
    MDR=TOS
    MAR=SP-1; wr
    TOS=H; goto Main1

(0x0D)IADD: MAR=SP=SP-1; rd
    H=TOS
    MDR=TOS=MDR+H; wr; goto Main1

(0x1F)ILOAD:H=LV;
    MAR=MBRU+H;rd;
    iload3: MAR=SP=SP+1;
    PC=PC+1; fetch; wr;
    TOS=MDR; goto Main1

(0x24)ISTORE: H=LV
    MAR=MBRU+H
    istore3: MDR=TOS;wr;
    SP=MAR=SP-1;rd
    PC=PC+1;fetch
    TOS=MDR; goto Main1

(0x2A)WIDE: PC=PC+1; fetch; goto(MBR or 0x100)

(0x2B)LDC_W: PC=PC+1; fetch;
    H=MBRU <<8
    H=MBRU OR H
    MAR=H+CPP; rd; goto iload3

(0x2F)IINC: H=LV
    MAR=MBRU+H; rd
    PC=PC+1; fetch
    H=MDR
    PC=PC+1; fetch
    MDR=MBR+H; wr; goto Main1

(0xA7)GOTO:OPC=PC-1
    goto2: PC=PC+1; fetch;
    H=MBR <<8
    H=MBRU OR H
    PC=OPC+H; fetch
    goto Main1

(0x09)IFLT: MAR=SP=SP-1; rd;
    OPC=TOS
    TOS=MDR
    N=OPC; if(N) goto T; else goto F

(0x35)IFEQ:MAR=SP=SP-1; rd;
    OPC=TOS
    TOS=MDR
    Z=OPC; if(Z) goto T; else goto F

(0x39)IF_ICMPEQ: MAR=SP=SP-1; rd
    MAR=SP=SP-1
    H=MDR;rd
    OPC=TOS
    TOS=MDR
    Z=OPC-H; if(Z) goto T; else goto F
    F:PC=PC+1
    PC=PC+1; fetch;
    goto Main1
(0x13F)T:OPC=PC-1;fetch; goto goto2


(0xB6)INVOKEVIRTUAL:PC=PC+1; fetch
    H=MBRU <<8
    H = MBRU OR H
    MAR=CPP + H; rd
    OPC = PC+1
    PC=MDR; fetch
    PC=PC+1; fetch
    H = MBRU <<8
    H = MBRU OR H
    PC=PC+1; fetch
    TOS=SP-H
    TOS=MAR=TOS+1
    PC=PC+1; fetch
    H = MBRU <<8
    H = MBRU OR H
    MDR = SP + H +1; wr
    MAR=SP=MDR
    MDR = OPC; wr
    MAR = SP = SP+1
    MDR = LV; wr
    PC=PC+1; fetch
    LV=TOS; goto Main1

(0xCC)IRETURN:MAR=SP=LV; rd
    ireturn1:   //wait
    LV=MAR=MDR; rd
    MAR=LV+1
    PC=MDR;rd;fetch
    MAR=SP
    LV=MDR
    MDR=TOS; wr; goto Main1`

const editorOptions: Partial<ace.Ace.EditorOptions> = {
  highlightActiveLine: true,
  minLines: 20,
  fontSize: 14,
  autoScrollEditorIntoView: true,
  useWorker: false,
}

const editorOptionsPresentation: Partial<ace.Ace.EditorOptions> = {
  highlightActiveLine: true,
  minLines: 20,
  fontSize: 26,
  autoScrollEditorIntoView: true,
  useWorker: false,
}


@Component({
  selector: "app-micro-editor",
  templateUrl: "./micro-editor.component.html",
  styleUrls: ["./micro-editor.component.scss"]
})
export class MicroEditorComponent implements AfterViewInit {
  presentationMode: boolean = false;

  @ViewChild("editor") private editor: ElementRef<HTMLElement>;
  content: string = "";
  private aceEditor: ace.Ace.Editor;
  file: string;


  constructor(
    private controller: ControllerService,
    private directorService: DirectorService,
    private themeControl: ThemeControlService,
    private presentationController: PresentationControllerService,
  ) { }


  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    ace.config.set("basePath", "assets/editor")

    // create Ace.Editor Object
    this.aceEditor = ace.edit(this.editor.nativeElement, this.getOptions());

    this.aceEditor.session.setValue(this.content);
    this.aceEditor.setTheme(THEME_LIGHT);
    this.aceEditor.session.setMode(LANG);

    // update when Microcode changes
    this.aceEditor.on("input", () => {
      this.content = this.aceEditor.getValue();

      // Updates the microcode on the micro provider
      this.controller.setMicroInModel(this.content);
      this.removeErrorHighlighting();
    })


    // toggle Theme
    this.themeControl.toggleThemeNotifier$.subscribe(
      lightMode => {
        if (lightMode) {
          this.aceEditor.setTheme(THEME_LIGHT)
        } else {
          this.aceEditor.setTheme(THEME_DARK)
        }
      }
    )

    // toggle Breakpoints
    let editor = this.aceEditor

    let setBreakpoint = (line: number) => {
      this.directorService.setMicroBreakpoint(line + 1);
    }

    let clearBreakpoint = (line: number) => {
      this.directorService.clearMicroBreakpoint(line + 1);
    }

    this.aceEditor.on("guttermousedown", function (e) {
      let target = e.domEvent.target;

      if (target.className.indexOf("ace_gutter-cell") == -1) { return; }
      if (!editor.isFocused()) { return; }
      if (e.clientX > 25 + target.getBoundingClientRect().left) { return; }

      const row = e.getDocumentPosition().row;
      const breakpoints = e.editor.session.getBreakpoints(row, 0)

      // If there's a breakpoint already defined, it should be removed
      if (typeof breakpoints[row] === typeof undefined) {
        e.editor.session.setBreakpoint(row);
        setBreakpoint(row);
      } else {
        e.editor.session.clearBreakpoint(row);
        clearBreakpoint(row);
      }
      e.stop();
    })

    // flash an error message when an error occurs
    this.directorService.errorFlasher$.subscribe(error => {
      if (error.error) {
        this.flashErrorMessage(error.error, error.line);
      }
    })

    // change editor options when Presentationmode is toggled
    this.presentationController.presentationMode$.subscribe(presentationMode => {
      if (presentationMode.presentationMode == true) {
        this.aceEditor.setOptions(editorOptionsPresentation)
      }
      else {
        this.aceEditor.setOptions(editorOptions)
      }
    });

    // highlight line if we hit a breakpoint
    this.directorService.breakpointFlasher$.subscribe(breakpoint => {
      if (breakpoint.line) {
        this.highlightBreakpoint(breakpoint.line)
      }
    });

    // clear Breakpoint when user clicks on Run / Step / StepMacro / Reset
    this.controller.clearBreakpoint$.subscribe(_ => { this.removeBreakpointHighlighting(); })

    // Current Line Highlighting
    this.directorService.currentLineNotifier$.subscribe(line => {
      this.highlightLine(line.line);
    })

    // updates microcode when new code is imported or microcode is loaded from local storage
    this.controller.microCode$.subscribe(
      content => {
        this.content = content.microCode;
        this.removeErrorHighlighting();
        this.aceEditor.session.clearBreakpoints();
        this.directorService.clearMicroBreakpoints();
        this.aceEditor.session.setValue(this.content);
      }
    )


    // clear Errors on refresh
    this.directorService.refreshNotifier$.subscribe(_ => {
      this.removeErrorHighlighting();
    })

    if(this.aceEditor.session.getValue() == ""){
      this.aceEditor.session.setValue(defaultMicro)
    }

  }

  private highlightLine(line: number) {
    this.removeLineHighlighting();
    this.aceEditor.getSession().addMarker(new ace.Range(line - 1, 0, line, 0), "ace_highlight-line", "text");
  }



  private highlightBreakpoint(line: number) {
    this.aceEditor.getSession().addMarker(new ace.Range(line - 1, 0, line, 0), "ace_breakpoint-line", "text");
    if (!this.aceEditor.isRowVisible(line)) {
      this.aceEditor.scrollToRow(line - 4);
    }
  }

  private flashErrorMessage(errorMessage: string, line: number) {
    if (line === 1000) { return; }
    this.aceEditor.getSession().setAnnotations(
      [{
        row: line - 1,
        column: 0,
        text: errorMessage,
        type: "error" // also "warning" and "information"
      }]
    );
    this.aceEditor.getSession().addMarker(new ace.Range(line - 1, 0, line, 0), "ace_error-line", "text");
    this.aceEditor.scrollToRow(line - 4);

  }

  private removeErrorHighlighting() {
    // clear Markers / syntax Highlighting
    const prevMarkers = this.aceEditor.session.getMarkers();
    if (prevMarkers) {
      const prevMarkersArr: any = Object.keys(prevMarkers);
      for (let item of prevMarkersArr) {
        if (prevMarkers[item].clazz == "ace_error-line") {
          this.aceEditor.session.removeMarker(prevMarkers[item].id);
        }
      }
    }

    // clear annotation
    this.aceEditor.session.clearAnnotations();
  }

  private removeBreakpointHighlighting() {
    const prevMarkers = this.aceEditor.session.getMarkers();
    if (prevMarkers) {
      const prevMarkersArr: any = Object.keys(prevMarkers);
      for (let item of prevMarkersArr) {
        if (prevMarkers[item].clazz == "ace_breakpoint-line") {
          this.aceEditor.session.removeMarker(prevMarkers[item].id);
        }
      }
    }
  }


  private removeLineHighlighting() {
    const prevMarkers = this.aceEditor.session.getMarkers();
    if (prevMarkers) {
      const prevMarkersArr: any = Object.keys(prevMarkers);
      for (let item of prevMarkersArr) {
        if (prevMarkers[item].clazz == "ace_highlight-line") {
          this.aceEditor.session.removeMarker(prevMarkers[item].id);
        }
      }
    }
  }


  getOptions() {
    if (this.presentationController.getPresentationMode() == false) {
      return editorOptions
    }
    else {
      return editorOptionsPresentation
    }
  }

  onSelect(event: any) {
    this.controller.importFile(event.addedFiles[0], "micro");
  }

}
