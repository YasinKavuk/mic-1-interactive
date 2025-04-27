import { Injectable } from '@angular/core';
import { AluService } from '../Model/Emulator/alu.service';
import { BBusService, BBusResult } from '../Model/Emulator/b-bus.service';
import { CBusService, CBusResult } from '../Model/Emulator/c-bus.service';
import { ControlStoreService } from '../Model/Emulator/control-store.service';
import { MainMemoryService } from '../Model/Emulator/main-memory.service';
import { Instruction, Line, ParserService } from '../Model/Emulator/parser.service';
import { ShifterService } from '../Model/Emulator/shifter.service';
import { RegProviderService } from '../Model/reg-provider.service';
import { StackProviderService } from '../Model/stack-provider.service';
import { BehaviorSubject } from 'rxjs';
import { MacroASTGeneratorService } from '../Model/macro-AST-Generator.service';
import { MacroTokenizerService } from '../Model/macro-tokenizer.service';
import { MacroProviderService } from '../Model/macro-provider.service';
import { MicroProviderService } from '../Model/micro-provider.service';
import { VideoControllerService } from '../Model/GraphicsAdapter/video-controller.service';
import { PresentationControllerService } from './presentation-controller.service';
import { SemanticCheckerService } from '../Model/semantic-checker.service';
import { CodeGeneratorService } from '../Model/code-generator.service';
import { MacroError } from '../Model/MacroErrors';
import { BatchTestService } from '../Model/batch-test.service';
import { ConsoleService } from '../Bachelor/Services/console.service';


@Injectable({
  providedIn: 'root'
})
export class DirectorService {

  constructor(
    private alu: AluService,
    private cBus: CBusService,
    private bBus: BBusService,
    private parser: ParserService,
    private shifter: ShifterService,
    private mainMemory: MainMemoryService,
    private consoleService: ConsoleService,
    private regProvider: RegProviderService,
    private controlStore: ControlStoreService,
    private batchTestService: BatchTestService,
    private stackProvider: StackProviderService,
    private macroProvider: MacroProviderService,
    private microProvider: MicroProviderService,
    private codeGenerator: CodeGeneratorService,
    private macroTokenizer: MacroTokenizerService,
    private semanticChecker: SemanticCheckerService,
    private videoController: VideoControllerService,
    private macroASTGenerator: MacroASTGeneratorService,
    private presentationController: PresentationControllerService,
  ) {
    // load AnimationEnabled from LocalStorage
    let enableAnim = localStorage.getItem("animationEnabled");
    // if there is no data in localStorage enable the animation
    if (enableAnim === "false") {
      this.animationEnabled = false;
    } else {
      this.animationEnabled = true;
    }

    // load animationSpeed from LocalStorage
    let animationSpeed = localStorage.getItem("animationSpeed");
    if (animationSpeed !== null) {
      this.animationSpeed = parseFloat(animationSpeed);
    } else {
      this.animationSpeed = 2;
    }

  }

  private currentAddress = 1;
  private lineNumber = 0;

  // wortaddresses for memory-mapped IO
  private memMapAddrGetKey = 1073741822
  private memMapAddrSetOut = 1073741821
  private memMapAddrEmptIO = 1073741820
  private memMapAddrSetInp = 1073741819
  private memMapAddrBackspace = 1073741818

  private MBRMemoryQueue: Array<number> = [];
  private MDRMemoryQueue: Array<number> = [];

  public isRunning = false;
  public endOfProgram = true;

  public animationSpeed: number;
  public animationEnabled = true;
  public isAnimating = false;

  noIntList: number[] = []
  noIntInstruction: boolean = false
  interrupted: boolean = false

  private delay = function (ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private microBreakpoints: Array<number> = [];
  private macroBreakpoints: Array<number> = [];
  private hitBreakpoint = false;


  // Observables to notify other components
  private startAnimationSource = new BehaviorSubject([]);
  public startAnimation = this.startAnimationSource.asObservable();

  private setRegisterValuesSource = new BehaviorSubject([]);
  public setRegisterValues = this.setRegisterValuesSource.asObservable();

  private _finishedRun = new BehaviorSubject<boolean>(false);
  public finishedRun$ = this._finishedRun.asObservable();

  private _errorFlasher = new BehaviorSubject({ line: 0, error: "" });
  public errorFlasher$ = this._errorFlasher.asObservable();

  private _breakpointFlasher = new BehaviorSubject({ line: 0 });
  public breakpointFlasher$ = this._breakpointFlasher.asObservable();

  private _breakpointFlasherMacro = new BehaviorSubject({ line: 0 });
  public breakpointFlasherMacro$ = this._breakpointFlasherMacro.asObservable();

  private _consoleNotifier = new BehaviorSubject("");
  public consoleNotifier$ = this._consoleNotifier.asObservable();

  private _currentLineNotifier = new BehaviorSubject({ line: 0 });
  public currentLineNotifier$ = this._currentLineNotifier.asObservable();

  private _currentLineNotifierMacro = new BehaviorSubject({ line: 0 });
  public currentLineNotifierMacro$ = this._currentLineNotifierMacro.asObservable();

  private _aluFlags = new BehaviorSubject({ N: false, Z: false });
  public aluFlags$ = this._aluFlags.asObservable();

  private _refreshNotifier = new BehaviorSubject(false);
  public refreshNotifier$ = this._consoleNotifier.asObservable();

  private _updateInterruptView = new BehaviorSubject({istr: 0, imr: 0});
  public updateInterruptView$ = this._updateInterruptView.asObservable();




  /** Setup the Director*/
  public init() {
    this.controlStore.loadMicro();
    this.endOfProgram = false;
    this.noIntList = this.parser.getNoIntList()
  }

  /** Run until macro-program is finished */
  public async run(testSettings?: any) {
    // let counter = 0;
    this.isRunning = true;
    this._finishedRun.next(false);
    console.log("false")
    while (!this.endOfProgram && this.isRunning) {
      // await new Promise(resolve => setTimeout(resolve, 0))

      await this.step();

      if (this.hitBreakpoint) {
        this.hitBreakpoint = false;
        break;
      }
    }

    if(testSettings !== undefined){
      this.batchTestService.test(testSettings)
    }
  }

  /** director has to be initialized first -> .init() */
  public async runMacroInstruction() {

    // no animation -> remember current animationEnabled Status
    const animationEnabledStore = this.animationEnabled;
    this.animationEnabled = false;

    // main-instruction (address: 1) gets executed after every instruction
    // if we reached main the macro-instruction is finished
    while (!this.endOfProgram) {
      await this.step();
      if (this.currentAddress === 1) { break };
      if (this.hitBreakpoint) {
        this.hitBreakpoint = false;
        break;
      }
    }

    // restore old animationEnabled value
    this.animationEnabled = animationEnabledStore;
  }

  public async step() {
    if (this.isAnimating) {
      this.updateRegisterVis();
    }

    // the flag 0xFF means the program is finished - if we find it -> end program
    // if (this.currentAddress === 255) {
    //   this.endOfProgram = true;
    //   this._consoleNotifier.next("Program terminated successfully!");
    //   this._finishedRun.next(false); // disableButtons
    //   return;
    // }

    if(this.regProvider.getRegister("ISTR").getValue() !== 0 && this.regProvider.getRegister("IMR").getValue() !== 1){
      let istrVal = this.regProvider.getRegister("ISTR").getValue()
      this.regProvider.setRegister("IMR", 1)
      this._updateInterruptView.next({istr: istrVal, imr: 1})
      this.triggerInterrupt()
    }

    if(this.regProvider.getRegister("ISTR").getValue() !== 0 && this.regProvider.getRegister("IMR").getValue() == 1){
      console.log("INTERRUPT BLOCKED")
      this.regProvider.setRegister("ISTR", 0)
    }

    // triggers an Event when MPC is the address of IRET
    if(this.currentAddress === 217){
      this._consoleNotifier.next("Interrupt-Return!")
      this._finishedRun.next(false)
      console.log("false")
      await this.returnContext()
    }

    // if we find opcode of NOP wait for 0ms -> otherwise the screen does not render (since we only have one Thread)
    if (this.presentationController.getGraphicsFunctionalityEnabled() || this.currentAddress === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }


    let line = this.controlStore.getMicro()[this.currentAddress];
    let tokens;

    // check if there is an Instruction at the current Address
    if (line === undefined) {
      this._errorFlasher.next({ line: 1000, error: "no Instruction at address " + this.currentAddress })
      this.endOfProgram = true;
      return;
    }

    // get line number of the Editor
    this.lineNumber = line.lineNumber;
    // console.log("Executing Instruction at Address: " + this.currentAddress + " line: " + this.lineNumber);
    this._currentLineNotifier.next({ line: line.lineNumber });


    // throw Error when there are no Tokens in current line
    try {
      tokens = line.tokens;
    } catch (error) {
      console.error("Error in line " + this.lineNumber + " - " + error);
      this._errorFlasher.next({ line: this.lineNumber, error: "Invalid Instruction" });
      this.endOfProgram = true;
      return;
    }
    if (!tokens) {
      throw new Error(`No Instruction at Address ${this.currentAddress}`);
    }

    // check if we hit a Breakpoint in the micro-code
    if (this.microBreakpoints.includes(this.lineNumber)) {
      console.log("%cHit Breakpoint in the micro-code in line " + this.lineNumber, "color: #248c46");
      this.hitBreakpoint = true;
      this._finishedRun.next(true)
      console.log("True")
      this._breakpointFlasher.next({ line: this.lineNumber });
    }


    const currentAddress = this.regProvider.getRegister("PC").getValue();

    if(this.noIntInstruction){
      this.noIntInstruction = false
      this.regProvider.setRegister("IMR", 0)
      this._updateInterruptView.next({istr: 0, imr: 0})
    }

    if(this.noIntList.includes(this.currentAddress) && this.interrupted == false){
      // console.log("-- Interrupts are blocked for this instruction --")
      // console.table(this.noIntList)
      this.noIntInstruction = true
      this.regProvider.setRegister("IMR", 1)
      this._updateInterruptView.next({istr: 0, imr: 1})
    }

    if (this.lineNumber == 1) {

      // lineHighlighting
      for (let i = 0; i < this.codeGenerator.lineAddrMap.length; i++) {
        let [editorLine, minMemory, maxMemory] = this.codeGenerator.lineAddrMap[i];


        if (currentAddress >= minMemory && currentAddress <= maxMemory) {
          this._currentLineNotifierMacro.next({ line: editorLine });
          break;
        }
      }


      // Check for MacroBreakpoints
      for (let breakpointLine of this.macroBreakpoints) {
        for (let [editorLine, minMemory, maxMemory] of this.codeGenerator.lineAddrMap) {
          if (breakpointLine === editorLine && currentAddress >= minMemory && currentAddress <= maxMemory) {
            console.log("%cHit Breakpoint in the memory address: " + (currentAddress) + ", MacroEditorLine: " + editorLine, "color: #248c46");
            this.hitBreakpoint = true;
            this._finishedRun.next(true)
            console.log("True")
            this._breakpointFlasherMacro.next({ line: editorLine });
          }
        }
      }
    }


    // set MBR
    if (this.MBRMemoryQueue[0]) {
      let addr = this.MBRMemoryQueue.shift();
      let MBR = this.regProvider.getRegister("MBR");

      MBR.setValue(this.mainMemory.get_8(addr));
    } else {
      this.MBRMemoryQueue.shift();
    }

    //set MDR
    if (this.MDRMemoryQueue[0]) {
      let addr = this.MDRMemoryQueue.shift();
      let MDR = this.regProvider.getRegister("MDR");

      // check if this is an read to an memory-mapped address. If yes fetch data from device-controller ( In this case console.service).
      if(addr === this.memMapAddrGetKey*4){
        console.log("Memory-mapped address for getKey detected: ", addr)
        this.regProvider.setRegister("MDR", this.consoleService.fetchKey())
      }
      else{
        MDR.setValue(this.mainMemory.get_32(addr));
      }

    } else { this.MDRMemoryQueue.shift(); }


    // parse instruction
    let microInstruction: Instruction
    try {
      microInstruction = this.parser.parse(tokens, this.currentAddress);
    } catch (error) {
      if (error instanceof Error) {

        // skip rest of current step if the instruction is empty
        if (error.message === "EmptyInstructionError") {

          // if the next Instruction is not defined -> error
          if (this.controlStore.getMicro()[this.currentAddress + 1] === undefined) {
            this._errorFlasher.next({ line: this.lineNumber, error: error.message });
            this.endOfProgram = true;
            return;
          };

          // if next instruction is defined skip to next instruction
          this.currentAddress++;
          // this._finishedRun.next(true);
          // console.log("True")
          this.updateRegisterVis();
          return;
        }

        console.error("Error in line " + this.lineNumber + " - " + error);
        this._errorFlasher.next({ line: this.lineNumber, error: error.message });
      }
      this.endOfProgram = true;
      return;
    }

    // calculate
    let bBusResult = this.bBus.activate(microInstruction.b);
    let [aluResult, aBusResult] = this.alu.calc(microInstruction.alu.slice(2));
    let shifterResult = this.shifter.shift(microInstruction.alu.slice(0, 2), aluResult);
    let cBusResult = this.cBus.activate(microInstruction.c, shifterResult);

    // memory instructions:
    // fetch
    if (microInstruction.mem[2]) {
      if (!this.MBRMemoryQueue[0]) { this.MBRMemoryQueue.push(0); }
      this.MBRMemoryQueue.push(this.regProvider.getRegister("PC").getValue());
    }
    // read
    if (microInstruction.mem[1]) {
      if (!this.MDRMemoryQueue[0]) { this.MDRMemoryQueue.push(0); }
      // MDR reads 32Bit Words -> multiply address in MAR with 4
      this.MDRMemoryQueue.push(this.regProvider.getRegister("MAR").getValue() * 4);
    }
    this.updateRegisterVis();
    //write
    if (microInstruction.mem[0]) {
      let addr = this.regProvider.getRegister("MAR").getValue() * 4;

      if(addr === this.memMapAddrSetOut*4){
        console.log("Memory-mapped address for setOut detected: ", addr)
        this.consoleService.setOutput(this.regProvider.getRegister("MDR").getValue())
      }
      else if(addr === this.memMapAddrEmptIO*4){
        console.log("Memory-mapped address for emptyOut detected: ", addr)
        this.consoleService.emptyIO()
      }
      else if(addr === this.memMapAddrSetInp*4){
        console.log("Memory-mapped address for SetInp detected: ", addr)
        this.consoleService.setInput(this.regProvider.getRegister("MDR").getValue())
      }
      else if(addr === this.memMapAddrBackspace*4){
        console.log("Memory-mapped address for Backspace detected: ", addr)
        this.consoleService.backspaceOnInput()
      }
      else{
        try {
          this.mainMemory.store_32(addr, this.regProvider.getRegister("MDR").getValue());
        } catch (error) {
          if (error instanceof Error) {
            console.error("Error in line " + this.lineNumber + " - " + error);
            this._errorFlasher.next({ line: this.lineNumber, error: error.message });
            this.isRunning = false;
            this.endOfProgram = true;
          }
          return
        }
      }
    }

    // update Stack
    this.stackProvider.update();

    // set next Address
    this.currentAddress = parseInt(microInstruction.addr.join(""), 2)

    // find address after a jump
    let micro = this.controlStore.getMicro()
    if (micro[this.currentAddress] === undefined) {

      let closestLine = Infinity;
      let address: string;

      for (var instruction in micro) {
        if (Object.prototype.hasOwnProperty.call(micro, instruction)) {
          if (micro[instruction].lineNumber - this.lineNumber > 0 && micro[instruction].lineNumber - this.lineNumber < closestLine) {
            closestLine = micro[instruction].lineNumber - this.lineNumber;
            address = instruction;
          }
        }
      }
      // console.log("next line is ", micro[parseInt(address)].lineNumber)
      this.currentAddress = parseInt(address);
    }

    // check if we have to jump
    if (microInstruction.jam[2] && aluResult === 0) {
      this.currentAddress += 256;
    }
    if (microInstruction.jam[1] && aluResult < 0) {
      this.currentAddress += 256;
    }

    this._aluFlags.next({ N: this.alu.n, Z: this.alu.z });

    // start Animation
    this.animate(bBusResult, aluResult, shifterResult, cBusResult, aBusResult);


    // wait for animation to finish -> animation sets isAnimating flag to false
    // while (this.isAnimating){}; does not work somehow so we check all 50ms for flag change
    while (true) {
      if (!this.isAnimating) { break };
      await this.delay(50);
    }

  }

  private animate(bBusResult: BBusResult, aluResult: number, shifterResult: number, cBusResult: CBusResult, aBusResult: number) {

    if (this.animationEnabled) {

      this.isAnimating = true;

      // Tell Mic-Visualization to start a animation via this Observable
      this.startAnimationSource.next([bBusResult, aluResult, shifterResult, cBusResult, aBusResult]);
    } else {
      // this._finishedRun.next(true);
      // console.log("True")
      this.updateRegisterVis();
    }
  }

  private showRegisterValue(register: string, value: number, activateMemoryArrow?: boolean) {
    this.setRegisterValuesSource.next([register, value, activateMemoryArrow == undefined ? false : activateMemoryArrow]);
  }

  private updateRegisterVis() {
    let registers = this.regProvider.getRegisters();

    // animate all Registers
    for (let register of registers) {
      this.showRegisterValue(register.getName(), register.getValue());
    }
  }


  public set animationComplete(animated: boolean) {
    console.log("animations Complete");
    this.updateRegisterVis()
    this.isAnimating = false;
    //enable buttons
    if (!this.isRunning) {
      this._finishedRun.next(true);
      console.log("True")
    }
  }


  // resets the director and also loads the program that is currently on the micro and macro editor
  public reset() {
    this.isRunning = false;
    this.currentAddress = 1;

    // reset all registers
    let registers = this.regProvider.getRegisters();
    for (let register of registers) {
      register.setValue(0);
    }

    this._currentLineNotifierMacro.next({ line: 0 })

    this._refreshNotifier.next(true);

    // reset Queues
    this.MBRMemoryQueue = [];
    this.MDRMemoryQueue = [];

    this.regProvider.setRegister("ISTR", 0)
    this.regProvider.setRegister("ISTR", 0)
    this._updateInterruptView.next({istr: 0, imr: 0})

    this.noIntInstruction = false
    this.interrupted = false

    this.consoleService.emptyIO()

    // reset memory
    this.mainMemory.emptyMemory();
    try {

      this.controlStore.loadMicro();
      let opcodes = this.controlStore.getMicroAddr()
      let macroTokens = this.macroTokenizer.tokenize()
      let ast = this.macroASTGenerator.parse(macroTokens)
      this.semanticChecker.checkSemantic(opcodes, ast)
      this.codeGenerator.generate(ast, opcodes);

    } catch (error) {
      if (error instanceof MacroError) {
        this.presentationController.flashErrorInMacro(error);
      }
      else if (error instanceof Error) {
        this._errorFlasher.next({ line: 1, error: error.message });
      }
      this._finishedRun.next(false); // disable run Buttons
      console.log("false")
      throw new Error("parserError");
    }


    // animate new register Values
    this.updateRegisterVis();

    //reset program
    this.endOfProgram = false;

    // reset stack View
    this.stackProvider.update()

    //enable buttons
    this._finishedRun.next(true);
    console.log("True")

    this.videoController.wipeScreen();

    // set Breakpoints Addresses for Macrocode
    // for (let i = 0; i < this.macroBreakpoints.length; i++) {
    //   this.macroBreakpointsAddr[i] = this.macroParser.getAddressOfLine(this.macroBreakpoints[i]);
    // }

    this.macroProvider.isLoaded();
    this.microProvider.isLoaded();


    // notify console that reset was successful
    this._consoleNotifier.next("Macrocode loaded successfully!");
  }

  public resetBatch() {
    this.isRunning = false;
    this.currentAddress = 1;

    // reset all registers
    let registers = this.regProvider.getRegisters();
    for (let register of registers) {
      register.setValue(0);
    }

    // reset Queues
    this.MBRMemoryQueue = [];
    this.MDRMemoryQueue = [];

    // reset memory
    this.mainMemory.emptyMemory();


    // animate new register Values
    this.updateRegisterVis();

    //reset program
    this.endOfProgram = false;

    // reset stack View
    this.stackProvider.update()

    //enable buttons
    this._finishedRun.next(true);
    console.log("True")

    this.videoController.wipeScreen();

    // set Breakpoints Addresses for Macrocode
    // for (let i = 0; i < this.macroBreakpoints.length; i++) {
    //   this.macroBreakpointsAddr[i] = this.macroParser.getAddressOfLine(this.macroBreakpoints[i]);
    // }

    this.macroProvider.isLoaded();
    this.microProvider.isLoaded();


    // notify console that reset was successful
    this._consoleNotifier.next("Macrocode loaded successfully!");
  }


  public setMicroBreakpoint(breakpoint: number) {
    if (this.microBreakpoints.includes(breakpoint)) { return; }
    this.microBreakpoints.push(breakpoint);
  }

  public clearMicroBreakpoint(breakpoint: number) {
    const index = this.microBreakpoints.indexOf(breakpoint)
    if (index > -1) {
      this.microBreakpoints.splice(index, 1);
    }
  }

  public clearMicroBreakpoints() {
    this.microBreakpoints = [];
  }

  public setMacroBreakpoint(breakpoint: number) {
    if (this.macroBreakpoints.includes(breakpoint)) { return; }
    this.macroBreakpoints.push(breakpoint);
  }

  public clearMacroBreakpoint(breakpoint: number) {
    const index = this.macroBreakpoints.indexOf(breakpoint)
    if (index > -1) {
      this.macroBreakpoints.splice(index, 1);
    }
  }

  public clearMacroBreakpoints() {
    this.macroBreakpoints = [];
  }

  public toggleAnimationEnabled(enabled: boolean) {
    this.animationEnabled = enabled;
    localStorage.setItem("animationEnabled", String(enabled));
  }

  public setAnimationSpeed(speed: number) {
    this.animationSpeed = speed;
    localStorage.setItem("animationSpeed", String(speed));
  }

  triggerInterrupt(){
    let intIdentification = this.regProvider.getRegister("ISTR").getValue()

    this.interrupted = true
    this.isRunning = false // stops the MIC-1

    this.saveContext()
    this.contextSwitch(intIdentification)

    this.mainMemory.printInputBuffer()
    this.mainMemory.printOutputBuffer()
    this.isRunning = true

    // Does not return the Context here
  }

  async returnContext(){
    console.log("--RETURNING CONTEXT--")

    this.isRunning = false

    let contextOrder: string[] = ["PC", "MAR", "SP", "LV", "CPP", "TOS", "OPC", "H"]

    const oldState = this.stackProvider.pop13() // get old register and ALU values for contex restoring
    this.mainMemory.pop13Stack() // needed to update Stack-View in the emulator not critical
    this.stackProvider.update()

    // returns registers and alu to old context
    for(let i = 0; i < oldState.length; i++){
      this.regProvider.setRegister(contextOrder[i], oldState[i][1])
    }
    this.alu.setN(Boolean(oldState[8][1]))
    this.alu.setZ(Boolean(oldState[9][1]))
    this.currentAddress = oldState[10][1]
    this.regProvider.setRegister("MDR", oldState[11][1])
    this.regProvider.setRegister("MBR", oldState[12][1])

    this.regProvider.setRegister("IMR", 0)
    this.regProvider.setRegister("ISTR", 0)
    this._updateInterruptView.next({istr: 0, imr: 0})

    this.interrupted = false
    this.isRunning = true
  }

  // save context (push registers to the stack)
  saveContext(){
    let regValues = this.regProvider.getNonMemoryRegisters()

    let stackAddr = (this.regProvider.getRegister("SP").getValue()+1)*4
    for(let i = 0; i < regValues.length; i++){
      console.log(regValues[i].getName())
      this.mainMemory.store_32(stackAddr, regValues[i].getValue());
      stackAddr += 4
    }
    this.mainMemory.store_32(stackAddr, Number(this.alu.n))
    this.mainMemory.store_32(stackAddr+4, Number(this.alu.z))
    console.log("current address: ", this.currentAddress)
    this.mainMemory.store_32(stackAddr+8, this.currentAddress) // saves MPC

    let newSP = this.regProvider.getRegister("SP").getValue() + 11
    this.setRegisterValuesSource.next(["SP", newSP, false]);
    this.regProvider.setRegister("SP", newSP)
    this.stackProvider.update()
  }

  // context swtich (jump to ISR)
  contextSwitch(intIdentification: number){

    // start of ISR is hardcoded thus needs to be updated when systemcode is changed. this.currentAddress is the MPC
    if(intIdentification == 3){
      this.regProvider.setRegister("PC", 80)
      this.setRegisterValuesSource.next(["PC", 80, false])
      this.currentAddress = 222
    }
    else if(intIdentification == 2){
      this.regProvider.setRegister("PC", 46)
      this.setRegisterValuesSource.next(["PC", 46, false])
      this.currentAddress = 222
    }
    else{
      this.regProvider.setRegister("PC", 21)
      this.setRegisterValuesSource.next(["PC", 21, false])
      this.currentAddress = 222
    }
  }
}
