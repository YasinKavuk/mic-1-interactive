import { Injectable } from '@angular/core';
import * as FileSaver from 'file-saver';
import { MacroProviderService } from '../Model/macro-provider.service';
import { MicroProviderService } from '../Model/micro-provider.service';
import { ControlStoreService } from '../Model/Emulator/control-store.service';
import { MacroTokenizerService } from '../Model/macro-tokenizer.service';
import { DirectorService } from './director.service';
import { BehaviorSubject } from 'rxjs';
import { MainMemoryService } from '../Model/Emulator/main-memory.service';
import { PresentationControllerService } from './presentation-controller.service';
import { BatchTestService } from '../Model/batch-test.service';
import { TestFile } from '../View/tutor-mode/tutor-mode.component';
import { MacroParserService } from '../Model/macro-parser.service';



const code1: string = `.main
BIPUSH 7
BIPUSH 8
INVOKEVIRTUAL add
.end-main

.method add(p1, p2)
ILOAD p1
ILOAD p2
IADD
IRETURN
.end-method`;

const code2: string = `.main
CPUSH 7
CPUSH 8
CINVOKE met
.end-main

.method met(p1, p2)
ILOAD p1
ILOAD p2
IADD
IRETURN
.end-method`;

const code3: string = `.main
BIPUSH 0
IFEQ skip
test: BIPUSH 8
BIPUSH 9
INVOKEVIRTUAL switch
skip: GOTO test
.end-main

.method switch(p1, p2)
ILOAD p2
ILOAD p1
.end-method`;

const microCode: string = `Main1: PC=PC+1; fetch; goto(MBR)

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

const customMicroCode: string = `Main1: PC=PC+1; fetch; goto(MBR)

(0x00)NOP:; goto Main1

(0xC6)BIPUSH: SP=MAR=SP+1;
PC=PC+1; fetch
MDR=TOS=MBR; wr; goto Main1;

(0x10)CPUSH: SP=MAR=SP+1;
PC=PC+1; fetch
MDR=TOS=MBR; wr; goto Main1;

(0x64)ISUB: MAR=SP=SP-1; rd
H=TOS
MDR=TOS=MDR-H; wr; goto Main1

(0x7E)IAND: MAR=SP=SP-1; rd
H=TOS
MDR=TOS=MDR AND H; wr; goto Main1

(0x80)IOR:MAR=SP=SP-1; rd
H=TOS
MDR=TOS=MDR OR H; wr; goto Main1

(0x59)DUP: MAR = SP = SP+1
MDR=TOS;wr;goto Main1

(0x57)POP: MAR=SP=SP-1; rd;
pop1:   //wait
TOS=MDR;goto Main1

(0x5E)SWAP: MAR=SP-1; rd;
MAR=SP
H=MDR;wr
MDR=TOS
MAR=SP-1; wr
TOS=H; goto Main1

(0x02)IADD: MAR=SP=SP-1; rd
H=TOS
MDR=TOS=MDR+H; wr; goto Main1

(0x15)ILOAD:H=LV;
MAR=MBRU+H;rd;
iload3: MAR=SP=SP+1;
PC=PC+1; fetch; wr;
TOS=MDR; goto Main1

(0x36)ISTORE: H=LV
MAR=MBRU+H
istore3: MDR=TOS;wr;
SP=MAR=SP-1;rd
PC=PC+1;fetch
TOS=MDR; goto Main1

(0xB5)WIDE: PC=PC+1; fetch; goto(MBR or 0x100)

(0x32)LDC_W: PC=PC+1; fetch;
H=MBRU <<8
H=MBRU OR H
MAR=H+CPP; rd; goto iload3

(0x84)IINC: H=LV
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

(0x9B)IFLT: MAR=SP=SP-1; rd;
OPC=TOS
TOS=MDR
N=OPC; if(N) goto T; else goto F

(0x99)IFEQ:MAR=SP=SP-1; rd;
OPC=TOS
TOS=MDR
Z=OPC; if(Z) goto T; else goto F

(0x9F)IF_ICMPEQ: MAR=SP=SP-1; rd
MAR=SP=SP-1
H=MDR;rd
OPC=TOS
TOS=MDR
Z=OPC-H; if(Z) goto T; else goto F
T:OPC=PC-1;fetch; goto goto2
F:PC=PC+1
PC=PC+1; fetch;
goto Main1

(0xB6)CINVOKE:PC=PC+1; fetch
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
MDR=TOS; wr; goto Main1`;

export interface TestSettings {
  testTos: boolean;
  tosValue: number;
  testStack: boolean;
  stackPositions: number[];
}

interface Submission {
  name: string;
  macro: string;
  micro: string;
  comment: string;
}


@Injectable({
  providedIn: 'root'
})
export class ControllerService {

  private _macroCode = new BehaviorSubject({ macroCode: "" });
  public macroCode$ = this._macroCode.asObservable();
  private _microCode = new BehaviorSubject({ microCode: "" });
  public microCode$ = this._microCode.asObservable();
  private _switchOnTutorMode = new BehaviorSubject({ files: [] });
  public switchOnTutorMode$ = this._switchOnTutorMode.asObservable();
  private _testStatus = new BehaviorSubject({ fileIndex: -1, status: "", error: "" })
  public testStatus = this._testStatus.asObservable();

  private testSettings = {
    testTos: false,
    tosValue: 0,
    testStack: false,
    stackPositions: [0]
  }

  public testFiles: TestFile[] = [];

  constructor(
    private macroProvider: MacroProviderService,
    private microProvider: MicroProviderService,
    private controlStore: ControlStoreService,
    private macroTokenizer: MacroTokenizerService,
    private macroParser: MacroParserService,
    private director: DirectorService,
    private mainMemory: MainMemoryService,
    private presentationController: PresentationControllerService,
    private batchTestService: BatchTestService,

  ) {
    const codeMac = localStorage.getItem("macroCode");
    const codeMic = localStorage.getItem("microCode");
    if (codeMac && codeMic) {
      this.setCodeInView(codeMac, codeMic);
    }
  }


  step() {
    if (this.macroProvider.getMacroGotChanged() || this.microProvider.getMicroGotChanged()) {
      this.controlStore.loadMicro();
      this.macroTokenizer.init();
      this.macroParser.parse();
      this.director.reset();
    }

    this.director.init();
    this.director.step();

    this.macroProvider.isLoaded();
    this.microProvider.isLoaded();
  }

  stepMacro() {
    if (this.macroProvider.getMacroGotChanged() || this.microProvider.getMicroGotChanged()) {
      this.controlStore.loadMicro();
      this.macroTokenizer.init();
      this.macroParser.parse();
      this.director.reset();
    }

    this.director.init();
    this.director.runMacroInstruction();

    this.macroProvider.isLoaded();
    this.microProvider.isLoaded();
  }

  reset() {
    this.director.reset();

    // step through INVOKEVIRUAL for main method
    this.stepMacro();
  }

  run() {
    if (this.macroProvider.getMacroGotChanged() || this.microProvider.getMicroGotChanged()) {
      this.controlStore.loadMicro();
      this.macroTokenizer.init();
      this.macroParser.parse();
      this.director.reset();
    }

    this.director.run();

    this.macroProvider.isLoaded();
    this.microProvider.isLoaded();
  }



  private readFile(inputFile: File) {

    const fileReader = new FileReader();

    return new Promise((resolve, reject) => {
      fileReader.onerror = () => {
        fileReader.abort();
        reject(new DOMException("Problem parsing input file."));
      };

      fileReader.onload = () => {
        resolve(fileReader.result.toString());
      };

      fileReader.readAsText(inputFile);
    });
  }

  private async readAllSubmissionFiles(files: File[]): Promise<Submission[]> {
    let testFiles: Submission[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const fileContent: any = await this.readFile(files[0]);
        if (typeof fileContent === "string") {
          testFiles.push(JSON.parse(fileContent));
        }
      } catch (error: any) {
        console.warn(error.message)
      }
    }

    return testFiles;
  }


  async batchTest(files: File[]) {
    console.log("-- Batch test start --");

    const submissions: Submission[] = await this.readAllSubmissionFiles(files);
    let errorList: string[] = [];

    for (let i = 0; i < submissions.length; i++) {
      let hasError = false;

      try {
        this.microProvider.setMicro(submissions[i].micro);
        this.controlStore.loadMicro();
        this.macroTokenizer.initWithFile(submissions[i].macro);
        this.macroParser.parse();
        this.director.endOfProgram = false;
        await this.director.run();
        this.batchTestService.test(this.testSettings);
      } catch (error) {
        hasError = true;
        errorList.push("Error on file " + (i + 1) + ": " + submissions[i].name);
        if (error instanceof Error) {
          this._testStatus.next({ fileIndex: i, status: "failed", error: error.message })
        }
      }
      if (!hasError) {
        this._testStatus.next({ fileIndex: i, status: "passed", error: "" });
      }
    }

    this.presentationController.batchTestResultToConsole(errorList);
    console.log("-- Batch test end --");
  }

  // takes array of files and imports them to a list in the tutor mode component. There they can be imported to the editors manually by the user
  importFiles(files: any[]) {
    if (files.length > 1 || this.presentationController.isTutorModeActive()) {
      this.presentationController.enableTutModeWithFiles(files);
    } else {
      this.importFile(files[0])
    }
  }

  importFile(file: File, target?: string) {
    if (target === "macro") {
      this.importToEditor(file, "macro");
    }
    else if (target === "micro") {
      this.importToEditor(file, "micro");
    }
    else {
      this.importToEditor(file);
    }
  }

  importToEditor(file: File, target?: string) {
    let fileReader = new FileReader();
    fileReader.readAsText(file);


    fileReader.onload = (e) => {
      if (JSON.parse(fileReader.result.toString()).macro !== '<DO NOT IMPORT>' && target !== "micro") {
        this.macroProvider.setMacro(JSON.parse(fileReader.result.toString()).macro);
        this._macroCode.next({ macroCode: JSON.parse(fileReader.result.toString()).macro });
      }

      if (JSON.parse(fileReader.result.toString()).micro !== '<DO NOT IMPORT>' && target !== "macro") {
        this.microProvider.setMicro(JSON.parse(fileReader.result.toString()).micro);
        this._microCode.next({ microCode: JSON.parse(fileReader.result.toString()).micro });
      }
    }
  }

  //downloads a json file with the macrocode and microcode as content
  export(name: string, macroBool: boolean, microBool: boolean, comment: string) {
    var textMac: string = ''
    var textMic: string = ''
    if (macroBool) {
      textMac = this.macroProvider.getMacro();
    } else { textMac = '<DO NOT IMPORT>' }
    if (microBool) {
      textMic = this.microProvider.getMicro();
    } else { textMic = '<DO NOT IMPORT>' }

    const json: JSON = <JSON><unknown>{
      "name": name,
      "macro": textMac,
      "micro": textMic,
      "comment": comment
    }
    const dataJson = new Blob([JSON.stringify(json)], { type: 'application/json' })
    FileSaver.saveAs(dataJson, name + ".json")
  }

  setMacroInModel(macro: string) {
    this.macroProvider.setMacro(macro);
  }

  setMicroInModel(micro: string) {
    this.microProvider.setMicro(micro);
  }

  setCodeInView(macro: string, micro: string) {
    this._macroCode.next({ macroCode: macro });
    this._microCode.next({ microCode: micro });
  }

  setDemoCode(demoCodeOption: string) {
    if (demoCodeOption === "demo1") {
      this.microProvider.setMicro(microCode);
      this.macroProvider.setMacro(code1);
      this._macroCode.next({ macroCode: code1 });
      this._microCode.next({ microCode: microCode });
    }
    if (demoCodeOption === "demo2") {
      this.microProvider.setMicro(customMicroCode);
      this.macroProvider.setMacro(code2);
      this._macroCode.next({ macroCode: code2 });
      this._microCode.next({ microCode: customMicroCode });
    }
    if (demoCodeOption === "demo3") {
      this.microProvider.setMicro(microCode);
      this.macroProvider.setMacro(code3);
      this._macroCode.next({ macroCode: code3 });
      this._microCode.next({ microCode: microCode });
    }
  }

  getEditorLineWithoutEmptyRows(line: number) {
    return this.macroProvider.getEditorLineWithoutEmptyRows(line);
  }

  getEditorLineWithParserLine(parserLine: number) {
    return this.macroProvider.getEditorLineWithParserLine(parserLine);
  }

  getTestSettings() {
    return this.testSettings;
  }


  setTestSettings(testTos: boolean, tosValue: number, testStack: boolean, stackPositions: number[]) {
    this.testSettings = { testTos: testTos, tosValue: tosValue, testStack: testStack, stackPositions: stackPositions };
  }

  dec2hex(dec: number) {
    return this.mainMemory.dec2hex(dec);
  }

}


