import { Injectable } from '@angular/core';
import { Token } from './macro-tokenizer.service';


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


export class MacroParserService {
  root: ASTNode = this.createNode("root", undefined, undefined, [{type: "constants", children: []}, {type: "methods", children: []}])
  tokens: Token[] = undefined

  methods: {[name: string]: number} = {}
  methodParameters: {[name: string]: ASTNode[]} = {}

  constructor(

  ){}


  parse(tokens: Token[]): ASTNode{
    this.generateAST(tokens);
    let returnRoot = this.root
    this.resetParser();
    return returnRoot;
  }

  resetParser(){
    this.root = this.createNode("root", undefined, undefined, [{type: "constants", children: []}, {type: "methods", children: []}])
    this.tokens = undefined
    this.methods = undefined
    this.methodParameters = undefined
    this.tokens = undefined
    this.methods = {}
    this.methodParameters = {}
  }

  // Generates am Anstract Syntax Tree (AST). The AST also includes and therefore keeps the information about the line number of the token.
  generateAST(tokens: Token[]){
    console.log("1")
    this.tokens = tokens
    console.log("2")
    let constArray: Token[] = this.getConstArray()
    console.log("3")
    let methodArrays: Token[][] = this.getMethodArrays()
    console.log("4")

    this.addConsts(constArray)
    console.log("5")
    this.addMethods(methodArrays)
    console.log("6")
    this.addRest()
    console.log("7")
    console.log(JSON.stringify(this.root, (key, value) => (key === 'parent' ? undefined : value), 2))
    console.log("8")
  }

  addConsts(constArray: Token[]){
    const constantsNode: ASTNode = this.root.children[0]
    let currentLine: number = -1
    for(let i = 1; i < constArray.length-1; i++){
      if(currentLine != constArray[i].line){
        this.addNode(constantsNode, this.createNode("constant", undefined, constArray[i].line, [{type: "identifier", value: constArray[i].value}]))
        currentLine = constArray[i].line
      }
      else{
        const constNode: ASTNode = constantsNode.children[constantsNode.children.length-1]
        this.addNode(constNode, this.createNode("value", constArray[i].value))
      }
    }
  }

  addMethods(methodsArray: Token[][]){
    const variablesNode: ASTNode = this.root.children[1].children[1]
    const methodsNode: ASTNode = this.root.children[1]
    let currentLine: number = -1

    for(let i = 0; i < methodsArray.length; i++){
      this.addMethod(methodsArray[i], methodsNode)
    }
  }

  addMethod(methodArray: Token[], methodsNode: ASTNode){
    let methodName: string = undefined
    let methodParameters: ASTNode[] = []
    let varField: boolean = false
    let currentLine = -1
    let methodNode: ASTNode = undefined
    let opCodesNode: ASTNode = undefined
    let variablesNode: ASTNode = undefined

    if(methodArray[0].type == "FIELD_MAIN"){
      methodName = "main"
    }
    else{
      methodName = methodArray[0].value.slice(8, methodArray[0].value.indexOf("("))
      methodParameters = this.extractParameters(methodArray[0].value)
    }
    
    this.addNode(methodsNode, this.createNode("method", methodName, undefined, [{type: "opCodes", children: []}, {type: "variables", children: []}, {type: "labels", children: []}, {type: "methodParameters", children: methodParameters}]))
    methodNode = methodsNode.children[methodsNode.children.length-1]

    for(let i = 1; i < methodArray.length-1; i++){
      if(currentLine != methodArray[i].line){
        if(methodArray[i].type == "FIELD_VAR"){
          varField = true
        }
        else if(methodArray[i].type == "FIELDEND_VAR"){
          varField = false
        }
        else if(methodArray[i].type == "NEW_LABEL"){
          this.addNode(methodNode.children[2], this.createNode("label", methodArray[i].value, methodArray[i].line))
          continue
        }
        else{
          if(varField == false){
            opCodesNode = methodNode.children[0]
            this.addNode(opCodesNode, this.createNode("opCode", undefined, undefined, [{type: "identifier", value: methodArray[i].value}, {type: "parameters", children: []}, {type: "line", value: methodArray[i].line}]))
          }
          else{
            variablesNode = methodNode.children[1]
            this.addNode(variablesNode, this.createNode("variable", undefined, undefined, [{type: "identifier", value: methodArray[i].value}]))
          }
        }
      }
      else{
        if(varField == false){
          this.addNode(opCodesNode.children[opCodesNode.children.length-1].children[1], this.createNode("parameter", methodArray[i].value))
        }
        else{
          this.addNode(variablesNode.children[variablesNode.children.length-1].children[1], this.createNode("value", methodArray[i].value))
        }
      }

      currentLine = methodArray[i].line
    }
  }

  // adds all tokens that are not in a Field as childnodes to root.
  addRest(){
    for(let token of this.tokens){
      this.addNode(this.root, this.createNode(token.type, token.value, token.line))
    }
  }

  getConstArray(): Token[]{
    let constArray: Token[] = []
    let constField: boolean = false
    let startLine: number = undefined
    let endLine: number = undefined

    for(let token of this.tokens){
      if(token.type == "FIELD_CONST"){
        constArray.push(token)
        constField = true;
        startLine = token.line
      }
      else if(token.type == "FIELDEND_CONST"){
        constArray.push(token)
        constField = false;
        endLine = token.line
        break
      }
      else{
        if(constField == true){
          constArray.push(token)
        }
      }
    }

    const filteredArray = this.tokens.filter((element) =>{
      return !(element.line >= startLine && element.line <= endLine)
    })
    this.tokens = filteredArray
    
    return constArray
  }

  getMethodArrays(): Token[][]{
    let methodArrays: Token[][] = [[]];
    let mainField: boolean = false
    let methodField: boolean = false
    let methodCount: number = -1

    let tmpMethodName: string = undefined

    let methodsStartEnd: {[name: string]: [number, number]} = {}

    for(let token of this.tokens){
      if(token.type == "FIELD_MAIN"){
        methodCount++
        this.methods["main"] = methodCount;
        methodArrays[this.methods["main"]].push(token)
        mainField = true
        methodsStartEnd["main"] = [token.line, undefined]
      }
      else if(token.type == "FIELD_METH"){
        let methodName: string = token.value.slice(8, token.value.indexOf("("))
        tmpMethodName = methodName
        let methodParameters: ASTNode[] = this.extractParameters(token.value)

        methodCount++
        this.methods[methodName] = methodCount;
        this.methodParameters[methodName] = methodParameters

        methodArrays[this.methods[methodName]] = methodArrays[this.methods[methodName]] || []; // this ensures that methodArrays[1] or higher is initialized
        methodArrays[this.methods[methodName]].push(token)
        methodField = true
        methodsStartEnd[methodName] = [token.line, undefined]
      }
      else if(token.type == "FIELDEND_MAIN" && methodField == false && mainField == true){
        methodArrays[this.methods["main"]].push(token)
        mainField = false;
        methodsStartEnd["main"] = [methodsStartEnd["main"][0], token.line]
      }
      else if(token.type == "FIELDEND_METH" && methodField == true && mainField == false){
        methodArrays[this.methods[tmpMethodName]].push(token)
        methodField = false;
        methodsStartEnd[tmpMethodName] = [methodsStartEnd[tmpMethodName][0], token.line]
        tmpMethodName = undefined
      }
      else{
        if(mainField == true){
          methodArrays[this.methods["main"]].push(token)
        }
        if((methodField == true)){
          methodArrays[this.methods[tmpMethodName]].push(token)
        }
      }
    }

    for (let method in methodsStartEnd) {
      const startLine: number = methodsStartEnd[method][0];
      const endLine: number = methodsStartEnd[method][1];
    
      const filteredArray = this.tokens.filter((element) => {
        return !(element.line >= startLine && element.line <= endLine);
      });
    
      this.tokens = filteredArray;
    }

    return methodArrays
  }



  createNode(type: string, value?: string | number, line?: number, children?: ASTNode[], parent?: ASTNode): ASTNode{
    return {
      type: type, 
      value: value, 
      editorLine: line, 
      children: children, 
      parent: parent
    }
  }

  addNode(parentNode: ASTNode, childNode: ASTNode){
    parentNode.children.push(childNode)
  }

  extractParameters(str: string): ASTNode[]{
    const startIndex = str.indexOf('(');
    const endIndex = str.indexOf(')');

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      const parametersString = str.substring(startIndex+1, endIndex );
      const trimmedParameters = parametersString.split(',').map(param => param.trim());

      let parameters: ASTNode[] = [];

      for(let parameter of trimmedParameters){
        parameters.push({type: "parameter", value: parameter})
      }

      return parameters;
    }

    return []
  }


}