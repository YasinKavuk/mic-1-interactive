import { Injectable } from '@angular/core';
import { ControlStoreService } from './Emulator/control-store.service';
import { MainMemoryService } from './Emulator/main-memory.service';
import { MacroTokenizerService } from './macro-tokenizer.service';
import { Token } from './micro-tokenizer.service';
import { PresentationControllerService } from '../Presenter/presentation-controller.service';

@Injectable({
  providedIn: 'root'
})
export class MacroParserService {
  tokens: Token[] = null;

  private constantOffsetToCPP: {[name: string]: number} = {};
  private variableOffsetToLV: {[name: string]: number} = {};
  private labels: {[name: string]: number} = {};
  private methods: {[name: string]: number} = {}; // gives a number that is a offset to a const. The value of this const is the startingpoint of this method
  private methodsParameterNumber: {[name: string]: number} = {}; // gives the number of parameters for a method
  private lineToLastUsedAddress: {[line: number]: number} = {};
  private addrToOffset: {[addr: number]: number} = {};

  // Returns the addres of an method addr that has a placeholder offset.
  // Needs the offset to CPP of this methods constant
  private methodToAddr: {[offsetCPP: number]: number} = {};

  private parsedCode: number[] = [];
  private constants: number[] = [];
  private variables: number[] = [];

  private varNumber: number = 0;
  private constNumber: number = 0;
  private parsedTokenNumber: number = 0;
  private methodNumber: number = 0;
  private currentLocalVarCount: number = 0; // temporary saves the number of current local variables when setVariable() is invoked
  private currentLine: number = 1;

  
  constructor(
    private macroTokenizer: MacroTokenizerService,
    private memory: MainMemoryService,
    private controlStore: ControlStoreService,
    private presentationController: PresentationControllerService,
  ) { }


  parse(){
    this.memory.emptyMemory();
    let ErrorFlag = false;

    this.resetParser();

    this.tokens = this.macroTokenizer.getTokens();
    this.setConstant();
    this.searchMethods();
    this.searchAllLabels();

    while(this.tokens.length > 0){
      if(this.tokens[0].value === '.main'){
        // Adds a Invoke to this main method at the address where this main method begins
        this.parsedCode.push(182); // 182 is the Address of INVOKEVIRTUAL
        const buffer = new ArrayBuffer(2);
        const view = new DataView(buffer, 0);
        view.setInt16(0, this.methods["main"]);
        this.parsedCode.push(view.getUint8(0));
        this.parsedCode.push(view.getUint8(1));
        view.setInt16(0, this.methods["main"]);
        this.parsedCode.push(view.getUint8(0));
        this.parsedCode.push(view.getUint8(1));
        this.parsedTokenNumber += 1;

        // if there was an Error in MainBlock set ErrorFlag
        this.mainBlock() ? ErrorFlag = true : {};

        // place a flag so that the director can use it as a flag for ending the program
        this.parsedCode.push(255);
        this.parsedTokenNumber += 1;
      }
      else if(this.tokens[0].value.slice(0, 7) === '.method'){
        let methodStr = this.tokens[0].value.slice(8);
        let methodName = methodStr.slice(0, methodStr.indexOf("("));

        // Adds a Invoke to this method at the address where this method begins
        const buffer = new ArrayBuffer(2);
        const view = new DataView(buffer, 0);
        view.setInt16(0, this.methodsParameterNumber[methodName] + 1); // +1 because objref is also always a parameter
        this.parsedCode.push(view.getUint8(0));
        this.parsedCode.push(view.getUint8(1))
        this.parsedTokenNumber += 2;

        // if there was an Error in MethodBlock set ErrorFlag
        this.methodBlock() ? ErrorFlag = true : {};

        // place a flag so that the director can use it as a flag for ending the program
        this.parsedCode.push(255);
        this.parsedTokenNumber += 1;
      }
      else{
        throw new Error("Unexpected Token: " + this.tokens[0].value);
      }
    }
    this.memory.setCode(this.parsedCode);
    this.memory.setConstants(this.constants);
    this.memory.createVariables(this.variables.length);

    this.presentationController.memoryViewRefresher(true);

    console.log("Memory: ");
    this.memory.printMemory();
    console.log("constantnames and their offset to CPP: ");
    console.table(this.constantOffsetToCPP);
    console.log("constant offsets and the value of the constant: ");
    console.table(this.constants);
    console.log("list of Methods: ");
    console.table(this.methods);
    console.log("methods and there number of parameters")
    console.table(this.methodsParameterNumber);
    console.log("variablenames and their offset to LV: ");
    console.table(this.variableOffsetToLV);
    console.log("variable offsets and the value of the variable at the end: ");
    console.table(this.variables);
    console.log("List of Labels and there positions:");
    console.table(this.labels);
    console.log("lines in the macroeditor and there last used address in main memory: ")
    console.table(this.lineToLastUsedAddress);
    console.log("Address in memory and the value of the offset that is stored in this address: ")
    console.table(this.addrToOffset);

    return ErrorFlag;
  }

  resetParser(){
    this.tokens = null;
    this.constantOffsetToCPP = {};
    this.variableOffsetToLV = {};
    this.labels = {};
    this.methods = {}
    this.methodsParameterNumber = {};
    this.lineToLastUsedAddress = {};
    this.addrToOffset = {};
    this.methodToAddr = {};

    this.parsedCode = [];
    this.constants = [];
    this.variables = [];

    this.varNumber = 0;
    this.constNumber = 0;
    this.parsedTokenNumber = 0; // 1 tokenized token can also lead to more than 1 parsed varlues in the memory
    this.methodNumber = 0;
    this.currentLocalVarCount = 0;
    this.currentLine = 1;

    this.presentationController.memoryViewRefresher(false);
  }

  // saves the constants with a value to the Main Memory and slices the constant field and the constant tokens out from the tokensarray
  private setConstant(){
    let startConstIndex = 0;
    let endConstIndex = 0;
    let constArr: Token[];

    //create objref with value 0 once
    let constName = "objref"
    let constValue: number = 0;
    this.constantOffsetToCPP[constName] = this.constNumber;
    this.constNumber += 1;
    this.constants.push(constValue);

    // sets startConstIndex and endConstIndex
    for(let i = 0; i < this.tokens.length; i++){
      if(this.tokens[i].value === '.constant'){
        startConstIndex = i;
        for(let j = i; j < this.tokens.length; j++){
          if(this.tokens[j].value === '.end-constant'){
            endConstIndex = j;
            break;
          }
        }
        if(endConstIndex === 0){
          throw new Error("Constantfield not closed. Close it with .end-constant");
        }
        break;
      }
    }

    // If there is no constant field
    if(startConstIndex === endConstIndex){
      return;
    }

    constArr = this.tokens.slice(startConstIndex + 1, endConstIndex);
    for(let constant of constArr){
      if(constant.type === 'NEW_CONSTANT'){
        let constName = constant.value.split(' ')[0];
        let constValue: number = parseInt(constant.value.split(' ')[1]);

        this.constantOffsetToCPP[constName] = this.constNumber;
        this.constNumber += 1;
        this.constants.push(constValue);

        this.currentLine += 1;
      }else{
        throw new Error("The following should not be in the constant field. \nType: " + constant.type + ", Value: " + constant.value);
      }
    }
    console.log("objref = 0 is also saved as a constant, but is not listed hiere. The offset to CPP is 0")
    console.table(constArr);
    this.tokens.splice(startConstIndex, endConstIndex + 1);

    this.currentLine += 2;
  }

  // saves the variables with the default value 0 and slices the value field and variable tokens out from the tokensarray
  private setVariable(arr: Token[]){
    // just find endVarIndex because the start is always mainBlockArr[0].value
    let startVarIndex = 0;
    let endVarIndex = 0;
    for(let i = 0; i < arr.length; i++){
      if(arr[i].value === '.end-var'){
        endVarIndex = i;
        break;
      }
    }
    if(endVarIndex === 0){
      throw new Error("Variablefield not closed. Close it with .end-var");
    }

    let varArr = arr.slice(startVarIndex + 1, endVarIndex);
    for(let variable of varArr){
      if(variable.type === "NEW_VARIABLE"){
        let varName: string = variable.value;
        this.varNumber += 1;
        this.variableOffsetToLV[varName] = this.varNumber;
        this.variables.push(0);

        this.currentLine += 1;
      }else{
        throw new Error("The following should not be in the variable field. \nType: " + variable.type + ", Value: " + variable.value);
      }
    }
    console.table(varArr);
    this.currentLocalVarCount = varArr.length
    console.log("LOCAL VARIABLE COUNT: " + (varArr.length));
    arr.splice(startVarIndex, varArr.length + 2);

    this.currentLine += 2;
  }

  private mainBlock(){
    let startMainIndex: number;
    let endMainIndex: number;

    let hasError = false;

    // finds start and end of main field
    for(let i = 0; i < this.tokens.length; i++){
      if(this.tokens[i].value === '.main'){
        startMainIndex = i;
        for(let j = i; j < this.tokens.length; j++){
          if(this.tokens[j].value === '.end-main'){
            endMainIndex = j;
            break;
          }
        }
        if(endMainIndex === 0){
          throw new Error("Mainfield not closed. Close it with .end-main");
        }
        break;
      }
    }

    // new array with only the main block
    let mainBlockArr: Token[] = [];
    mainBlockArr = this.tokens.slice(startMainIndex + 1, endMainIndex);

    // var field inside the main field
    if(mainBlockArr[0].type === 'FIELD'){
      if(mainBlockArr[0].value !== '.var'){
        throw new Error("This Field is not allowed in this scope: " + mainBlockArr[0].value);
      }
      this.setVariable(mainBlockArr);

      // writes the number of local variables to the memory
      const buffer = new ArrayBuffer(2);
      const view = new DataView(buffer, 0);
      view.setInt16(0, this.currentLocalVarCount);
      this.parsedCode.push(view.getUint8(0));
      this.parsedCode.push(view.getUint8(1));
      this.parsedTokenNumber += 2;
      this.currentLocalVarCount = 0; // reverts the value back to 0, so the next invokation of setVariable() can again count the right number of local variables
    }
    else{
      const buffer = new ArrayBuffer(2);
      const view = new DataView(buffer, 0);
      view.setInt16(0, 0);
      this.parsedCode.push(view.getUint8(0));
      this.parsedCode.push(view.getUint8(1));
      this.parsedTokenNumber += 2;
    }
    this.lineToLastUsedAddress[this.currentLine] = this.parsedTokenNumber+3;
    this.currentLine += 1;
    console.log("currentLine: " + this.currentLine);

    // create constant that has the startingpoint of this main-method in memory as the value. Than replace the
    // placeholder disp after the INVOKEVIRTUAL with the offset to this constant
    let constName = "dispConstMethod" + this.methods["main"];
    let constValue: number = this.parsedTokenNumber;
    this.constantOffsetToCPP[constName] = this.constNumber;
    this.constNumber += 1;
    this.constants.push(constValue);
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer, 0);
    view.setInt16(0, this.methods["main"]);
    let valueByte1: number = view.getUint8(0);
    let valueByte2: number = view.getUint8(1);
    view.setInt16(0, this.constantOffsetToCPP[constName]);
    for(let i = 0; i < this.parsedCode.length; i++){
      if(this.parsedCode[i] === 182 && this.parsedCode[i+1] === valueByte1 && this.parsedCode[i+2] === valueByte2){
        this.parsedCode[i+1] = view.getUint8(0);
        this.parsedCode[i+2] = view.getUint8(1);
      }
    }

    // instructions in the main field
    for(let instruction of mainBlockArr){
      let instructionToken = instruction.value.split(' ');
      console.log(instructionToken);

      for(let i = 0; i < instructionToken.length; i++){
        // The first element of instruction is always the instruction without parameters
        if(i == 0){
          let controlStoreAddresses = this.controlStore.getMicroAddr();
          let instructionAddress = controlStoreAddresses[instructionToken[0]];

          // Instruction that is already in the control store
          if(instructionAddress !== undefined){
            this.parsedCode.push(instructionAddress);
            this.parsedTokenNumber += 1;

            if(instructionToken.length === 1){
              this.lineToLastUsedAddress[this.currentLine] = this.parsedTokenNumber+3;
              console.log("currentLine: " + this.currentLine);
            }
          }
          // Instruction that is not in the control store or label
          else{
            // If it ends with ':' than it is a label
            if(instructionToken[0].endsWith(':')){
              // save label and the address it points to the labels dictionary
              this.labels[instructionToken[0]] = this.parsedTokenNumber + 1;
              console.log("Create Label " + instructionToken[0] + " that is pointing to parsed token " + this.labels[instructionToken[0]]);
            }
            // Throws Error because unknown token
            else{
              this.presentationController.flashErrorInMacro(this.currentLine, "Address of " + instructionToken[0] + " is: " + instructionAddress)
              hasError = true;
              throw new Error("Address of " + instructionToken[0] + " is: " + instructionAddress);
              // console.error("Address of " + instructionToken[0] + " is: " + instructionAddress);
            }
          }
        }
        // The following elements are parameters
        else{
          // if parsedParameter is not undefined after this, the parameter is a constant
          let parsedParameter = this.constantOffsetToCPP[instructionToken[i]];

          if(parsedParameter !== undefined && instructionToken[i-1] === "LDC_W"){
            let parsedParameterTmp = parsedParameter;
            const buffer = new ArrayBuffer(2);
            const view = new DataView(buffer, 0);
            view.setInt16(0, parsedParameterTmp);
            this.parsedCode.push(view.getUint8(0));
            this.parsedTokenNumber += 1;
            parsedParameter = view.getUint8(1);
          }

          // if parsedParameter is not undefined after this, the parameter is a variable
          if(parsedParameter === undefined){
            parsedParameter = this.variableOffsetToLV[instructionToken[i]];
          }

          // if parsedParameter is not NaN after this, the parameter is a byte
          if(parsedParameter === undefined){
            if(+instructionToken[i] < -128 || +instructionToken[i] > 127){
              throw new Error("The number " + +instructionToken[i] + " does not fit in a signed byte");
            }
            parsedParameter = +instructionToken[i];
          }

          // If parsed Parameter is NaN than it must be a offset/label or a method index
          // The check for method parameters is not here. So just offset and method.
          // Case for method
          if(this.methods[instructionToken[i]] >= 0){
            // method index
            const buffer = new ArrayBuffer(2);
            const view = new DataView(buffer, 0);
            let offsetToConst = this.methods[instructionToken[i]];
            view.setInt16(0, offsetToConst);
            this.parsedCode.push(view.getUint8(0));
            this.parsedTokenNumber += 1;
            parsedParameter = view.getUint8(1);

            this.addrToOffset[this.parsedTokenNumber+4] = undefined; // offset will be set in the methodBlock method
            this.methodToAddr[offsetToConst] = this.parsedTokenNumber+4;
          }
          // Case for label/offset
          else{
            // case for the label beeing in an earlyer line than the GOTO
            if(isNaN(parsedParameter)){
              let label = this.labels[instructionToken[i] + ":"];
              let offset: number = 0;
              if(label !== undefined && label > 0){
                offset = label - this.parsedTokenNumber;
                console.log("OFFSET: " + offset);
                this.addrToOffset[this.parsedTokenNumber+5] = this.parsedTokenNumber+3 + offset;
                const buffer = new ArrayBuffer(2);
                const view = new DataView(buffer, 0);
                view.setInt16(0, offset);
                this.parsedCode.push(view.getUint8(0));
                this.parsedTokenNumber += 1;
                parsedParameter = view.getUint8(1);
              }
              // case for the label beeing in an later line than the GOTO
              else{
                // search where the label is in the later code and calculate offset
                let labelTokenPosition = 3;
                for(let instruction2 of mainBlockArr){
                  let instructionToken2 = instruction2.value.split(' ');
                  for(let j = 0; j < instructionToken.length; j++){
                    if(instructionToken2[j] === instructionToken[i] + ":"){
                      labelTokenPosition += 1;
                      offset = labelTokenPosition - this.parsedTokenNumber;
                      break;
                    }
                    if(offset !== 0){
                      break;
                    }
                    else{
                      if(this.labels[instructionToken2[j] + ":"] !== undefined){
                        labelTokenPosition += 2;
                      }
                      else if(instructionToken2[j] === undefined || instructionToken2[j].endsWith(":")){
                        continue;
                      }
                      else if(this.methods[instructionToken2[j]] >= 0){
                        labelTokenPosition += 2
                      }
                      else if(this.constantOffsetToCPP[instructionToken2[j]] > 0){
                        labelTokenPosition += 2;
                      }
                      else{
                        labelTokenPosition += 1;
                      }
                    }
                  }
                }

                if(labelTokenPosition > 0 && offset !== 0){
                  console.log("OFFSET: " + offset);
                  this.addrToOffset[this.parsedTokenNumber+5] = this.parsedTokenNumber+3 + offset;
                  const buffer = new ArrayBuffer(2);
                  const view = new DataView(buffer, 0);
                  view.setInt16(0, offset);
                  this.parsedCode.push(view.getUint8(0));
                  this.parsedTokenNumber += 1;
                  parsedParameter = view.getUint8(1);
                }
                else{
                  throw new Error("Unexpected token: " + instructionToken[i]);
                }
              }
            }
          }

          console.log(parsedParameter);
          this.parsedCode.push(parsedParameter);
          this.parsedTokenNumber += 1;

          this.lineToLastUsedAddress[this.currentLine] = this.parsedTokenNumber+3;
          this.currentLine += 1;
          console.log("currentLine: " + this.currentLine);
        }
      }
    }
    this.currentLine += 1;

    // mainblock is sliced out of the tokens when the block is parsed
    this.tokens.splice(startMainIndex, endMainIndex + 1);

    if(this.currentLine > 10000){
      throw new Error("To many Lines to parse. The main-field is probably not closed with '.end-main'")
    }

    return hasError;
  }

  private methodBlock(){
    let startMethodIndex: number;
    let endMethodIndex: number;
    let startTokenNumberMethod = this.parsedTokenNumber + 2;
    let methodName: string = "";
    let parameters: string = "";
    let parameterNames: string[] = [];

    let hasError = false;

    // finds start and end of method field. Also sets methodName and parameters
    for(let i = 0; i < this.tokens.length; i++){
      if(this.tokens[0].value.slice(0, 7) === '.method'){
        startMethodIndex = i;
        methodName = this.tokens[0].value.slice(8, this.tokens[0].value.indexOf("("));
        parameters = this.tokens[0].value.slice(this.tokens[0].value.indexOf("(")+1, this.tokens[0].value.indexOf(")")+1);
        for(let j = i; j < this.tokens.length; j++){
          if(this.tokens[j].value === '.end-method'){
            endMethodIndex = j;
            break;
          }
        }
        if(endMethodIndex === 0){
          throw new Error("Methodfield not closed. Close it with .end-method");
        }
        break;
      }
    }

    // adds parameter names to parameterNames array
    let parameter: string = ""
    for(let i = 0; i < parameters.length; i++){
      if(parameters.charAt(i) === ',' || parameters.charAt(i) === ' ' || parameters.charAt(i) === ')'){
        if(parameter !== ""){
          parameterNames.push(parameter);
        }
        parameter = "";
      }
      else{
        parameter += parameters.charAt(i);
      }
    }

    // new array with only the method block
    let methodBlockArr: Token[] = [];
    methodBlockArr = this.tokens.slice(startMethodIndex + 1, endMethodIndex);

    // var field inside the method field
    if(methodBlockArr[0].type === 'FIELD'){
      if(methodBlockArr[0].value !== '.var'){
        throw new Error("This Field is not allowed in this scope: " + methodBlockArr[0].value);
      }
      this.setVariable(methodBlockArr);

      // writes the number of local variables to the memory
      const buffer = new ArrayBuffer(2);
      const view = new DataView(buffer, 0);
      view.setInt16(0, this.currentLocalVarCount);
      this.parsedCode.push(view.getUint8(0));
      this.parsedCode.push(view.getUint8(1));
      this.parsedTokenNumber += 2;
      this.currentLocalVarCount = 0; // reverts the value back to 0, so the next invokation of setVariable() can again count the right number of local variables
    }
    else{
      const buffer = new ArrayBuffer(2);
      const view = new DataView(buffer, 0);
      view.setInt16(0, 0);
      this.parsedCode.push(view.getUint8(0));
      this.parsedCode.push(view.getUint8(1));
      this.parsedTokenNumber += 2;
    }
    this.lineToLastUsedAddress[this.currentLine] = this.parsedTokenNumber+3;
    this.currentLine += 1;
    console.log("currentLine: " + this.currentLine);

    // create constant that has the startingpoint of this method in memory as the value. Than replace the
    // placeholder disp after the INVOKEVIRTUAL with the offset to this constant
    let constName = "dispConstMethod" + this.methods[methodName];
    let constValue: number = this.parsedTokenNumber;
    this.constantOffsetToCPP[constName] = this.constNumber;
    this.constNumber += 1;
    this.constants.push(constValue);
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer, 0);
    view.setInt16(0, this.methods[methodName]);
    let valueByte1: number = view.getUint8(0);
    let valueByte2: number = view.getUint8(1);
    view.setInt16(0, this.constantOffsetToCPP[constName]);

    // contains the found i indexes in the following for-loop. The last element is this array is the index of the value we need to replace.
    // Thats where we need to replace the the method number(that is a placeholder) with the disp of this method
    let candiatesForReplacement: number[] = [];
    for(let i = 0; i < this.parsedCode.length; i++){
      if(this.parsedCode[i] === 182 && this.parsedCode[i+1] === valueByte1 && this.parsedCode[i+2] === valueByte2){
        candiatesForReplacement.push(i)
      }
    }

    for(let i = 0; i < candiatesForReplacement.length; i++){
      let indexOfValueToReplace = candiatesForReplacement[i]
      this.parsedCode[indexOfValueToReplace+1] = view.getUint8(0);
      this.parsedCode[indexOfValueToReplace+2] = view.getUint8(1);
    }

    // replace placeholder offset in addrToOffset
    this.addrToOffset[this.methodToAddr[this.constantOffsetToCPP[constName]]] = constValue;

    // instructions in the method field
    for(let instruction of methodBlockArr){
      let instructionToken = instruction.value.split(' ');
      console.log(instructionToken);

      for(let i = 0; i < instructionToken.length; i++){
        // The first element of instruction is always the instruction without parameters
        if(i == 0){
          let controlStoreAddresses = this.controlStore.getMicroAddr();
          let instructionAddress = controlStoreAddresses[instructionToken[i]];

          // Instruction that is already in the control store
          if(instructionAddress !== undefined){
            this.parsedCode.push(instructionAddress);
            this.parsedTokenNumber += 1;

            if(instructionToken.length === 1){
              this.lineToLastUsedAddress[this.currentLine] = this.parsedTokenNumber+3;
              console.log("currentLine: " + this.currentLine);
            }
          }
          // Instruction that is not in the control store or label
          else{
            // If it ends with ':' than it is a label
            if(instructionToken[0].endsWith(':')){
              // save label and the address it points to the labels dictionary
              this.labels[instructionToken[0]] = this.parsedTokenNumber + 1;
              console.log("Create Label " + instructionToken[0] + " that is pointing to parsed token " + this.labels[instructionToken[0]]);
            }
            // Throws Error because unknown token
            else{
              // Comment in when microcode is fully available. And comment out the log
              // throw new Error("Unexpected Token: " + instructionToken[0]);
              console.error("Address of " + instructionToken[0] + " is: " + instructionAddress);
              this.presentationController.flashErrorInMacro(this.currentLine, "Address of " + instructionToken[0] + " is: " + instructionAddress)
              hasError = true;
            }
          }
        }
        // The following elements are parameters
        else{
          // if parsedParameter is not undefined after this, the parameter is a constant
          let parsedParameter = this.constantOffsetToCPP[instructionToken[i]];

          if(parsedParameter !== undefined && instructionToken[i-1] === "LDC_W"){
            let parsedParameterTmp = parsedParameter;
            const buffer = new ArrayBuffer(2);
            const view = new DataView(buffer, 0);
            view.setInt16(0, parsedParameterTmp);
            this.parsedCode.push(view.getUint8(0));
            this.parsedTokenNumber += 1;
            parsedParameter = view.getUint8(1);
          }

          // if parsedParameter is not undefined after this, the parameter is a variable
          if(parsedParameter === undefined){
            parsedParameter = this.variableOffsetToLV[instructionToken[i]] + (this.methodsParameterNumber[methodName]);
          }

          // if parsedParameter is not NaN after this, the parameter is a byte
          if(isNaN(parsedParameter)){
            if(+instructionToken < -128 || +instructionToken > 127){
              throw new Error("The number " + +instructionToken + " does not fit in a signed byte");
            }
            parsedParameter = +instructionToken[i];
          }

          // case for method parameternames
          if(isNaN(parsedParameter)){
            for(let j = 0; j < parameterNames.length; j++){
              if(instructionToken[i] === parameterNames[j]){
                parsedParameter = j+1;
              }
            }
          }

          // If parsed Parameter is NaN than it must be a offset, method, or a method parameter
          // The check for method parameters comes not here. So just offset and method
          // Case for method
          if(this.methods[instructionToken[i]] >= 0){
            // method index
            const buffer = new ArrayBuffer(2);
            const view = new DataView(buffer, 0);
            let offsetToConst = this.methods[instructionToken[i]];
            view.setInt16(0, offsetToConst);
            this.parsedCode.push(view.getUint8(0));
            this.parsedTokenNumber += 1;
            parsedParameter = view.getUint8(1);

            this.addrToOffset[this.parsedTokenNumber+4] = undefined; // offset will be set in the methodBlock method
            this.methodToAddr[offsetToConst] = this.parsedTokenNumber+4;
          }
          // Case for label/offset
          else{
            // case for label beeing in an earlyer line than the GOTO
            if(isNaN(parsedParameter)){
              let label = this.labels[instructionToken[i] + ":"];
              let offset: number = 0;
              if(label !== undefined && label > 0){
                offset = label - this.parsedTokenNumber;
                console.log("OFFSET: " + offset);
                // only consider label when it is in the same method
                if((this.parsedTokenNumber+offset) >= startTokenNumberMethod){ 
                  this.addrToOffset[this.parsedTokenNumber+5] = this.parsedTokenNumber+3 + offset;
                  const buffer = new ArrayBuffer(2);
                  const view = new DataView(buffer, 0);
                  view.setInt16(0, offset);
                  this.parsedCode.push(view.getUint8(0));
                  this.parsedTokenNumber += 1;
                  parsedParameter = view.getUint8(1);
                }else{
                  throw new Error("The Label '" + instructionToken[i] + "' and the jump instruction is not in the same method");
                }
              }
              // case for the label beeing in an later line than the GOTO
              else{
                // search where the label is in the later code and calculate offset
                let labelTokenPosition = startTokenNumberMethod;
                for(let instruction2 of methodBlockArr){
                  let instructionToken2 = instruction2.value.split(' ');
                  for(let j = 0; j < instructionToken.length; j++){
                    if(instructionToken2[j] === instructionToken[i] + ":"){
                      labelTokenPosition += 1;
                      offset = (labelTokenPosition) - this.parsedTokenNumber;
                      break;
                    }
                    if(offset !== 0){
                      break;
                    }
                    else{
                      if(this.labels[instructionToken2[j] + ":"] !== undefined){
                        labelTokenPosition += 2;
                      }
                      else if(instructionToken2[j] === undefined || instructionToken2[j].endsWith(":")){
                        continue;
                      }
                      else if(this.methods[instructionToken2[j]] >= 0){
                        labelTokenPosition += 2
                      }
                      else if(this.constantOffsetToCPP[instructionToken2[j]] > 0){
                        labelTokenPosition += 2;
                      }
                      else{
                        labelTokenPosition += 1;
                      }
                    }
                  }
                }

                if(labelTokenPosition > 0 && offset !== 0){
                  console.log("OFFSET: " + offset);
                  this.addrToOffset[this.parsedTokenNumber+5] = this.parsedTokenNumber+3 + offset;
                  const buffer = new ArrayBuffer(2);
                  const view = new DataView(buffer, 0);
                  view.setInt16(0, offset);
                  this.parsedCode.push(view.getUint8(0));
                  this.parsedTokenNumber += 1;
                  parsedParameter = view.getUint8(1);
                }
                else{
                  throw new Error("The Label '" + instructionToken[i] + "' and the jump instruction is not in the same method");
                }
              }
            }
          }


          console.log(parsedParameter);
          this.parsedCode.push(parsedParameter);
          this.parsedTokenNumber += 1;

          this.lineToLastUsedAddress[this.currentLine] = this.parsedTokenNumber+3;
          this.currentLine += 1;
          console.log("currentLine: " + this.currentLine);
        }
      }
    }
    this.currentLine += 1;

    // methodblock is sliced out of the tokens when the block is parsed
    this.tokens.splice(startMethodIndex, endMethodIndex + 1);

    if(this.currentLine > 10000){
      throw new Error("To many Lines to parse. The method-field for the '" + methodName + "' method is probably not closed with '.end-method'")
    }

    return hasError
  }

  searchMethods(){
    for(let token of this.tokens){
      let methodStr = this.tokens[0].value.slice(8);

      // main-method block is identified and constant that indicatetes where this method begins is created
      if(token.type === "FIELD" && token.value === ".main"){
        this.methodNumber += 1;
        this.methods["main"] = this.methodNumber;
      }

      // other method blocks are identified and there parameters are counted.
      // it creates an identifying entry to the dictionary methods. The number in this entry is than later
      // used to place a 2 byte number in the memory after an 'INVOKEVIRTUAL'. This number is than later replaced
      // by a offset to a constant that has the place where this method begins as the value.
      if(token.type === "FIELD" && token.value.slice(0, 7) === ".method"){
        let methodStr = token.value.slice(8);
        let methodName = methodStr.slice(0, methodStr.indexOf("("));
        let parameterStr = methodStr.slice(methodStr.indexOf("("), methodStr.indexOf(")")+1);
        let parameterCount = 0;

        this.methodNumber += 1;
        this.methods[methodName] = this.methodNumber;

        for(let i = 0; i < parameterStr.length; i++){
          if(parameterStr.charAt(i) === ","){
            if(parameterCount === 0){
              parameterCount += 1;
            }
            parameterCount += 1;
          }
        }
        if(parameterCount === 0 && parameterStr !== "()"){
          parameterCount = 1;
        }
        this.methodsParameterNumber[methodName] = parameterCount;
      }
    }
  }

  // All labels are found and saved in a dictionary. There position is temporary set to -1 and is set later.
  searchAllLabels(){
    for(let i = 0; i < this.tokens.length; i++){
      if(this.tokens[i].type === "NEW_LABEL"){
        this.labels[this.tokens[i].value] = -1;
      }
    }
  }

  getAddressOfLine(line: number){
    return this.lineToLastUsedAddress[line];
  }

  getLineOfAddress(addr: number){
    let i = 0;
    while(true){
      if(this.lineToLastUsedAddress[i] === addr){
        break;
      }
      else{
        i++;
      }
    }
    return i;
  }

  getOffsetOnAddress(addr: number){
    return this.addrToOffset[addr];
  }

}
