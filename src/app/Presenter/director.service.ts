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
import { BehaviorSubject, Subscription } from 'rxjs';
import { MacroASTGeneratorService } from '../Model/macro-AST-Generator.service';
import { MacroTokenizerService } from '../Model/macro-tokenizer.service';
import { MacroProviderService } from '../Model/macro-provider.service';
import { MicroProviderService } from '../Model/micro-provider.service';
import { VideoControllerService } from '../Model/GraphicsAdapter/video-controller.service';
import { PresentationControllerService } from './presentation-controller.service';
import { SemanticCheckerService } from '../Model/semantic-checker.service';
import { CodeGeneratorService } from '../Model/code-generator.service';


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
    private regProvider: RegProviderService,
    private controlStore: ControlStoreService,
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
  private currentMacroAddr = 0;

  private MBRMemoryQueue: Array<number> = [];
  private MDRMemoryQueue: Array<number> = [];

  public isRunning = false;
  public endOfProgram = true;

  public animationSpeed: number;
  public animationEnabled = true;
  public isAnimating = false;

  private delay = function (ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private microBreakpoints: Array<number> = [];
  private macroBreakpoints: Array<number> = [];
  private macroBreakpointsAddr: Array<number> = [];
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

  private _aluFlags = new BehaviorSubject({ N: false, Z: false });
  public aluFlags$ = this._aluFlags.asObservable();

  private _refreshNotifier = new BehaviorSubject(false);
  public refreshNotifier$ = this._consoleNotifier.asObservable();




  /** Setup the Director*/
  public init() {
    this.controlStore.loadMicro();
    this.endOfProgram = false;
  }

  /** Run until macro-program is finished */
  public async run() {
    let counter = 0;
    this.isRunning = true;
    while (!this.endOfProgram && this.isRunning) {
      await this.step();
      if (this.hitBreakpoint) {
        this.hitBreakpoint = false;
        break;
      }
      // stop after 1000 steps (probably endless loop)
      if (counter >= 1000) {
        this._consoleNotifier.next("Stopping run at Step " + counter + " - your program is probably in a endless loop. If that is not the case just press Run again!")
        break;
      }
      counter++;
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
    if (this.currentAddress === 255) {
      this.endOfProgram = true;
      this._consoleNotifier.next("Program terminated successfully!");
      this._finishedRun.next(false); // disableButtons
      return;
    }


    // if we find opcode of NOP wait for 0ms -> otherwise the screen does not render
    if (this.presentationController.getGraphicsFunctionalityEnabled() || this.currentAddress === 0){
      await  new Promise(resolve => setTimeout(resolve, 0));
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
    console.log("Executing Instruction at Address: " + this.currentAddress + " line: " + this.lineNumber);
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
      this._breakpointFlasher.next({ line: this.lineNumber });
    }

    // check if we hit a Breakpoint in the macro-code
    if (this.macroBreakpointsAddr.includes(this.currentMacroAddr)) {
      console.log("%cHit Breakpoint in the memory address: " + (this.currentMacroAddr), "color: #248c46");
      this.hitBreakpoint = true;
      this._finishedRun.next(true)
      // this._breakpointFlasherMacro.next({ line: this.macroParser.getLineOfAddress(this.currentMacroAddr) });
    }

    // set MBR
    if (this.MBRMemoryQueue[0]) {
      let addr = this.MBRMemoryQueue.shift();
      let MBR = this.regProvider.getRegister("MBR");

      // if (this.macroParser.getOffsetOnAddress(this.currentMacroAddr) !== undefined) {
      //   let offset = this.macroParser.getOffsetOnAddress(this.currentMacroAddr) - 1;
      //   this.currentMacroAddr = offset;
      //   console.log("%cHit Jump-Instruction offset. Jump to memory address: " + (this.currentMacroAddr + 1), "color: #248c46");
      // }
      this.currentMacroAddr += 1;


      MBR.setValue(this.mainMemory.get_8(addr));
    } else {
      this.MBRMemoryQueue.shift();
    }

    //set MDR
    if (this.MDRMemoryQueue[0]) {
      let addr = this.MDRMemoryQueue.shift();
      let MDR = this.regProvider.getRegister("MDR");
      MDR.setValue(this.mainMemory.get_32(addr));
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
          this._finishedRun.next(true);
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
    //write
    if (microInstruction.mem[0]) {
      let addr = this.regProvider.getRegister("MAR").getValue() * 4;
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

    // update Stack
    this.stackProvider.update();

    // set next Address
    this.currentAddress = parseInt(microInstruction.addr.join(""), 2)

    // find address after a jump
    let micro = this.controlStore.getMicro()
    if (micro[this.currentAddress] === undefined && this.currentAddress !== 255) {

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
      console.log("next line is ", micro[parseInt(address)].lineNumber)
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
      this._finishedRun.next(true);
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
    }
  }


  // resets the director and also loads the program that is currently on the micro and macro editor
  public reset() {
    this.isRunning = false;
    this.currentAddress = 1;
    this.currentMacroAddr = 0;

    // reset all registers
    let registers = this.regProvider.getRegisters();
    for (let register of registers) {
      register.setValue(0);
    }

    this._refreshNotifier.next(true);

    // reset Queues
    this.MBRMemoryQueue = [];
    this.MDRMemoryQueue = [];

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
      if (error instanceof Error) {
        this._errorFlasher.next({ line: 1, error: error.message });
      }
      return;
    }
    try {
    } catch (error) {
      if (error instanceof Error) {
        this._errorFlasher.next({ line: 1000, error: error.message });
        return;
      }
    }


    // animate new register Values
    this.updateRegisterVis();

    //reset program
    this.endOfProgram = false;

    // reset stack View
    this.stackProvider.update()

    //enable buttons
    this._finishedRun.next(true);

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
}
