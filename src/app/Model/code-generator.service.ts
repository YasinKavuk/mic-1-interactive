import { Injectable } from '@angular/core';
import { MainMemoryService } from './Emulator/main-memory.service';
import { PresentationControllerService } from '../Presenter/presentation-controller.service';


export interface ASTNode{
  type: string,
  value?: string | number,
  editorLine?: number, // for highlighting the right line in the editor for different purposes like highlighting an error.
  children?: ASTNode[], 
  parent?: ASTNode
}

@Injectable({
  providedIn: 'root'
})
export class CodeGeneratorService {
  opCodeToValue: { [name: string]: number } = undefined
  constNameToCPPOffset: {[name: string]: number} = {["objref"]: 0} // there is always a constant objref with value 0
  labelToAddress: {[name: string]: number} = {}
  labelNameToPlaceholderAddress: {[name: string]: number} = {}
  methodNameToPlaceholderAddress: {[name: string]: number} = {}

  constCount: number = 1;
  methodCount: number = 0;

  currentAddress: number = 0;

  // mc = machine code
  mcMethods: number[] = [] 
  mcConstants: number[] = [0] // there is always a constant objref with value 0

  // some lists/arrays of different parameters. if a parameter is in one of this lists than we can get the type of this parameter. Types: byte, offset, const, varnum, disp, index
  methods: string[] = []
  labels: string[] = []
  constants: string[] = []
  variables: string[] = []

  lineAddrMap: number[][] = []


  constructor(
    private memory: MainMemoryService, 
    private presentationController: PresentationControllerService
  ) { }

  // generates a machine code that can be executed by the MIC1
  generate(ast: ASTNode, opcodes: { [opcode: string]: number }){
    this.opCodeToValue = opcodes

    this.setTypeLists(ast)

    let constNodes: ASTNode[] = ast.children[0].children
    let methNodes: ASTNode[] = ast.children[1].children


    this.memory.emptyMemory()

    this.generateConstants(constNodes, methNodes)
    for(let methNode of methNodes){
      this.generateMethod(methNode)
    }

    this.replacePlaceholder()

    console.log("opCodeToValue")
    console.table(this.opCodeToValue)
    console.log("constNameToCPPOffset")
    console.table(this.constNameToCPPOffset)
    console.log("labelToAddress")
    console.table(this.labelToAddress)
    console.log("labelNameToPlaceholderAddress")
    console.table(this.labelNameToPlaceholderAddress)
    console.log("methodNameToPlaceholderAddress")
    console.table(this.methodNameToPlaceholderAddress)

    console.log("mcMethods")
    console.table(this.mcMethods)
    console.log("mcConstants")
    console.table(this.mcConstants)

    console.log("methods")
    console.table(this.methods)
    console.log("labels")
    console.table(this.labels)
    console.log("constants")
    console.table(this.constants)
    console.log("variables")
    console.table(this.variables)

    console.log("Mapping for editor line to address start and end")
    console.table(this.lineAddrMap)

    this.memory.setCode(this.mcMethods)
    this.memory.setConstants(this.mcConstants)
    this.memory.createVariables(this.variables.length)

    this.presentationController.memoryViewRefresher(true);
    this.memory.printMemory()

    this.reset()
  }

  generateConstants(constNodes: ASTNode[], methNodes: ASTNode[]){
    // generates the constants that are given by the user
    for(let constNode of constNodes){
      this.mcConstants.push(constNode.children[1].value as number)
      this.constNameToCPPOffset[constNode.children[0].value] = this.constCount
      this.constCount++
    }

    // handels the constants that are needed as "disp" parameter type to invoke methods. The constant itself is not added to mcConstants because the value is not known yet. It is set when method is generated.
    for(let methNode of methNodes){
      this.constNameToCPPOffset["dispMethodConst_" + methNode.value] = this.constCount
      this.constCount++
    }
  }

  generateMethod(methNode: ASTNode){
    let labelLine: number[] = []

    let localVarCount: number = 0
    
    let lineToLabelName: {[line: number]: string} = {}
    let localVarNameToLVOffset: {[name: string]: number} = {}

    // for converting decimal numbers to bytes
    let buffer = new ArrayBuffer(2)
    let view = new DataView(buffer, 0)

    for(let label of methNode.children[2].children){
      labelLine.push(label.editorLine as number)
      lineToLabelName[label.editorLine as number] = label.value as string
    }

    if(methNode.value == "main"){
      // the program always starts with main and it has a hardcoded invokevirtual(182) to main at the beginning
      this.mcMethods.push(182)
      this.mcConstants.push(this.currentAddress+3)
      view.setInt16(0, this.constNameToCPPOffset["dispMethodConst_" + methNode.value])
      this.mcMethods.push(view.getUint8(0))
      this.mcMethods.push(view.getUint8(1))
      this.currentAddress += 3
    }
    else{
      this.mcConstants.push(this.currentAddress)
      view.setInt16(0, this.constNameToCPPOffset["dispMethodConst_" + methNode.value])
    }

    let methParamCount = methNode.children[3].children.length+1 // +1 because objref is also always a parameter of every method, but it's not listed in the AST
    let methVarCount = methNode.children[1].children.length
    view.setInt16(0, methParamCount)
    this.mcMethods.push(view.getUint8(0))
    this.mcMethods.push(view.getUint8(1))
    view.setInt16(0, methVarCount)
    this.mcMethods.push(view.getUint8(0))
    this.mcMethods.push(view.getUint8(1))
    
    this.currentAddress += 4
    
    // add all parameters and variables to localVarNameToLVOffset. First parameter gets offset of 1 the second parameter has an offset of 2 and so on. Than the variables get the later offsets. We can than get the offset of the param type varnum.
    for(let param of methNode.children[3].children){
      localVarCount++
      localVarNameToLVOffset[param.value] = localVarCount
      this.variables.push(param.value as string)
    }
    for(let variable of methNode.children[1].children){
      localVarCount++
      localVarNameToLVOffset[variable.children[0].value] = localVarCount
      this.variables.push(variable.children[0].value as string)
    }

    console.log("localVarNameToLVOffset")
    console.table(localVarNameToLVOffset)


    for(let opCode of methNode.children[0].children){
      let addrStart: number = this.currentAddress
      let addrEnd: number = undefined
      
      if(labelLine.includes(opCode.children[2].value as number)){
        this.labelToAddress[lineToLabelName[opCode.children[2].value as number]] = this.currentAddress + 1
      }
      this.mcMethods.push(this.opCodeToValue[opCode.children[0].value])
      this.currentAddress++

      for(let param of opCode.children[1].children){
        let paramType = this.getParamType(param.value)

        if(paramType == "offset"){
          if(this.labelToAddress[param.value + ":"] != undefined){
            let offset = this.labelToAddress[param.value + ":"] - this.currentAddress
            view.setInt16(0, offset)
            this.mcMethods.push(view.getUint8(0))
            this.mcMethods.push(view.getUint8(1))
          }
          // than the label address is not known yet. A placeholder is used an offset of 3 just would jump to the next opCode
          else{
            view.setInt16(0, 0)
            this.mcMethods.push(view.getUint8(0))
            this.mcMethods.push(view.getUint8(1))
            this.labelNameToPlaceholderAddress[param.value] = this.currentAddress
          }
          this.currentAddress += 2
        }
        else if(paramType == "varnum"){
          this.mcMethods.push(localVarNameToLVOffset[param.value])
          this.currentAddress++
        }
        else if(paramType == "disp"){
          view.setInt16(0, 0)
          this.mcMethods.push(view.getUint8(0))
          this.mcMethods.push(view.getUint8(1))
          this.methodNameToPlaceholderAddress[param.value] = this.currentAddress

          this.currentAddress += 2
        }
        else if(paramType == "index"){
          if(this.constNameToCPPOffset[param.value] != undefined){
            console.log(this.constNameToCPPOffset[param.value])
            view.setInt16(0, this.constNameToCPPOffset[param.value])
            this.mcMethods.push(view.getUint8(0))
            this.mcMethods.push(view.getUint8(1))
          }
          this.currentAddress += 2
        }
        else{
          this.mcMethods.push(parseInt(param.value as string))
          this.currentAddress++
        }
      }
      addrEnd = this.currentAddress-1
      this.lineAddrMap.push([opCode.children[2].value as number, addrStart, addrEnd])
    }

    this.mcMethods.push(255)
    this.currentAddress++
  }

  replacePlaceholder(){
    // for converting decimal numbers to bytes
    let buffer = new ArrayBuffer(2)
    let view = new DataView(buffer, 0)
        
    for(const labelName in this.labelNameToPlaceholderAddress){
      const labelPlaceHolderAddr = this.labelNameToPlaceholderAddress[labelName]
      const labelAddress = this.labelToAddress[labelName + ":"]

      view.setInt16(0, labelAddress - labelPlaceHolderAddr)
      this.mcMethods[labelPlaceHolderAddr] = view.getUint8(0)
      this.mcMethods[labelPlaceHolderAddr+1] = view.getUint8(1)
    }

    for(const methodName in this.methodNameToPlaceholderAddress){
      const methodPlaceHolderAddr = this.methodNameToPlaceholderAddress[methodName]
      const methodDisp = this.constNameToCPPOffset["dispMethodConst_" + methodName]

      view.setInt16(0, methodDisp)
      this.mcMethods[methodPlaceHolderAddr] = view.getUint8(0)
      this.mcMethods[methodPlaceHolderAddr+1] = view.getUint8(1)
    }
  }

  setTypeLists(ast: ASTNode){
    for(let constNode of ast.children[0].children){
      this.constants.push(constNode.children[0].value as string)
    }
    for(let methNode of ast.children[1].children){
      this.constants.push("dispMethodConst_" + methNode.value)
      this.methods.push(methNode.value as string)

      for(let label of methNode.children[2].children){
        this.labels.push(label.value as string)
      }
    }
  }

  getParamType(param: string | number): string{
    if(this.labels.includes(param + ":" as string)){
      return "offset"
    }
    else if(this.variables.includes(param as string)){
      return "varnum"
    }
    else if(this.methods.includes(param as string)){
      return "disp"
    }
    else if(this.constants.includes(param as string)){
      return "index"
    }
    else{
      return "byte" // byte or const. Both are handled the same
    }
  }

  reset(){
    this.opCodeToValue = undefined
    this.constNameToCPPOffset = {["objref"]: 0} // there is always a constant objref with value 0
    this.labelToAddress = {}
    this.labelNameToPlaceholderAddress = {}
    this.methodNameToPlaceholderAddress = {}
  
    this.constCount = 1;
    this.methodCount = 0;
  
    this.currentAddress = 0;
  
    this.mcMethods = [] 
    this.mcConstants = [0] // there is always a constant objref with value 0 
  
    this.methods = []
    this.labels = []
    this.constants = []
    this.variables = []

    this.presentationController.memoryViewRefresher(false);
  }
}
