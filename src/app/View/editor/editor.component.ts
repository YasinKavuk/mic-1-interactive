import { AfterViewInit, Component, ElementRef, OnChanges, SimpleChanges, ViewChild } from "@angular/core";
import { MacroProviderService } from "src/app/Model/macro-provider.service";
import * as ace from "ace-builds";
import { DirectorService } from "src/app/Presenter/director.service";
import { timer } from "rxjs";
import { ThemeControlService } from "src/app/Presenter/theme-control.service";
import { PresentationControllerService } from "src/app/Presenter/presentation-controller.service";
import { ControllerService } from "src/app/Presenter/controller.service";


const LANG = "ace/mode/mic1";
const THEME_DARK = "ace/theme/gruvbox";
const THEME_LIGHT = "ace/theme/eclipse";

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
  selector: "app-editor",
  templateUrl: "./editor.component.html",
  styleUrls: ["./editor.component.scss"]
})


export class EditorComponent implements AfterViewInit {
  presentationMode: boolean = false;
  tutorMode: boolean = false;

  @ViewChild("editor") private editor: ElementRef<HTMLElement>;
  content: string = "";
  private aceEditor: ace.Ace.Editor;
  file: String;

  constructor(
    private directorService: DirectorService,
    private themeController: ThemeControlService,
    private presentationController: PresentationControllerService,
    private controller: ControllerService,
  ) { }

  ngOnInit(): void {
    this.presentationController.tutorMode$.subscribe(
      content => {
        this.tutorMode = content.tutorMode;
      }
    )
  }

  ngAfterViewInit(): void {
    ace.config.set("basePath", "assets/editor");

    // create Ace.Editor Object
    this.aceEditor = ace.edit(this.editor.nativeElement, this.getOptions());

    this.aceEditor.session.setValue(this.content);
    this.aceEditor.setTheme(THEME_DARK);
    this.aceEditor.session.setMode(LANG);

    // update when Macrocode changes
    this.aceEditor.on("input", () => {
      this.content = this.aceEditor.getValue();

      // Updates the macrocode on the macro provider
      this.controller.setMacroInModel(this.content);
      this.removeErrorHighlighting();
    })

    // toggle Breakpoints
    let editor = this.aceEditor;

    let setBreakpoint = (line: number) => {
      this.directorService.setMacroBreakpoint(line + 1);
    }

    let clearBreakpoint = (line: number) => {
      this.directorService.clearMacroBreakpoint(line + 1);
    }


    // toggle Theme
    this.themeController.toggleThemeNotifier$.subscribe(
      lightMode => {
        if (lightMode) {
          this.aceEditor.setTheme(THEME_LIGHT)
        } else {
          this.aceEditor.setTheme(THEME_DARK)
        }
      }
    )

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
    });

    // flash an error message when an error occurs
    this.presentationController.errorFlasher$.subscribe(error => {
      if (error.message) {
        console.log(error.line);
        this.flashErrorMessage(error.name + " - " + error.message, error.line);
      }
    });

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
    this.directorService.breakpointFlasherMacro$.subscribe(breakpoint => {
      if (breakpoint.line) {
        this.highlightBreakpoint(breakpoint.line)
      }
    });

    // current line Highlighting
    this.directorService.currentLineNotifierMacro$.subscribe(line => {
      if (line.line === 0) {
        this.removeLineHighlighting();
        return;
      }
      this.highlightLine(line.line);
    })

    // updates macrocode when new code is imported or macrocode is loaded from local storage
    this.controller.macroCode$.subscribe(
      content => {
        this.content = content.macroCode;
        this.removeErrorHighlighting();
        this.aceEditor.session.setValue(this.content);
        this.directorService.clearMacroBreakpoints();
        this.aceEditor.session.setValue(this.content);
      }
    )

    // clear Breakpoint when user clicks on Run / Step / StepMacro / Reset 
    this.controller.clearBreakpoint$.subscribe(
      _ => {
        this.removeBreakpointHighlighting();
      }
    )
  }

  private highlightBreakpoint(line: number) {
    this.aceEditor.getSession().addMarker(new ace.Range(line - 1, 0, line, 0), "ace_breakpoint-line", "text");
    if (!this.aceEditor.isRowVisible(line)) {
      this.aceEditor.scrollToRow(line - 4);
    }
  }

  private flashErrorMessage(errorMessage: string, line: number) {
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

  getOptions() {
    if (this.presentationController.getPresentationMode() == false) {
      return editorOptions
    }
    else {
      return editorOptionsPresentation
    }
  }

  onSelect(event: any) {
    this.controller.importFile(event.addedFiles[0], "macro");
  }

  private highlightLine(line: number) {
    this.removeLineHighlighting();
    this.aceEditor.getSession().addMarker(new ace.Range(line - 1, 0, line, 0), "ace_highlight-line", "text");
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
}