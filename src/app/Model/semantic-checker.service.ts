import { Injectable } from '@angular/core';
import { ASTNode } from './macro-parser.service';

@Injectable({
  providedIn: 'root'
})
export class SemanticCheckerService {

  private validOpcodes: string[] = [];
  private ast: ASTNode;
  private constantNames: string[] = [];

  constructor() { }


  checkSemantic(opcodes: { [opcode: string]: number }, ast: ASTNode) {
    console.log(JSON.stringify(ast, (key, value) => (key === 'parent' ? undefined : value), 2))
    this.validOpcodes = Object.keys(opcodes);
    this.ast = ast;
    this.checkForMainMethod();
    this.checkConstants();
    this.checkMethods();
  }

  private checkForMainMethod() {
    const methodNode = this.ast.children[2]

    if (methodNode.children.length === 0) {
      throw new Error("noEntryPointError - The program has no main method. Add a main method by using 'main' ... '.end-main'");
    }

    for (let method of methodNode.children) {
      if (method.value === "main") {
        return true;
      }
    }

    throw new Error("noEntryPointError - The program has no main method. Add a main method by using 'main' ... '.end-main'");
  }

  private checkConstants() {
    this.constantNames = [];
    const constants = this.ast.children[0];

    for (let constant of constants.children) {

      if (!this.isValidConstantIdentifier(constant.children[0])) {
        throw new Error(`syntaxError - A constant needs an identifier and a value. E.g.: "const 10"`)
      }
      if (constant.children.length !== 2) {
        throw new Error(`argumentError - A constant needs exactly one argument, but ${constant.children.length - 1} were given`);
      }
      if (typeof constant.children[0].value !== "string") {
        throw new Error(`typeError - Expected string, but ${typeof constant.children[0].value} was given`);
      }
      if (this.constantNames.includes(constant.children[0].value)) {
        throw new Error(`redefinitionError - constant "${constant.children[0].value}" was already declared`)
      }

      this.constantNames.push(constant.children[0].value);
    }
  }

  private isValidConstantIdentifier(node: ASTNode): boolean {
    if (typeof node.value !== "string") {
      return false
    }
    //Constants start with an alphabetic Character, followed by zero  or more alphanumeric characters
    const matched = /^([a-zA-Z]([a-zA-Z0-9]*))/.exec(node.value);
    console.log(matched)
    return matched !== null;
  }

  private checkMethods() {
    const allMethods = this.ast.children[2].children;

    for (let method of allMethods) {
      this.checkMethod(method);
    }
  }

  private checkMethod(methodNode: ASTNode) {

    const [opCodes, variables, labels, methodParameters] = methodNode.children;

    for (let line of opCodes.children) {
      this.checkIfValidMethodLine(line);
    }

    this.checkMethodVariables(variables);
    this.checkMethodParameters(methodParameters);
    this.checkMethodLabels(labels);

  }

  private checkIfValidMethodLine(line: ASTNode) {
    console.log(JSON.stringify(line, (key, value) => (key === 'parent' ? undefined : value), 2))
    /* TODO: 
      1. Line muss mit identifier anfangen, Identifier muss in Opcode liste sein
      2. Identifier muss in Opcode Liste sein
      3. Parameter müssen Zahlen sein
      4. Parameter müssen in ein Byte passen
    */
  }

  private checkMethodVariables(variables: ASTNode) {
    console.log(JSON.stringify(variables, (key, value) => (key === 'parent' ? undefined : value), 2))
    /* TODO: 
      1. Identifier muss ein String sein
      2. Identifier darf nicht mit Konstantennamen Kollidieren
      3. Nach einem Identifier darf nichts weiteres kommen
    */
  }

  private checkMethodParameters(parameters: ASTNode) {
    /* TODO: 
      1. Parameter müssen ein String sein
      2. Parametername muss wohlgeformt sein
      3. Parametername darf nicht mit Konstantennammen Kollidieren 
    */
  }

  private checkMethodLabels(labels: ASTNode){
    /* TODO: 
      1. Label müssen der Namenskonvention entsprechen
      2. Label dürfen (innherhalb einer Methode) nicht mehrmals vorkommen
    */
  }



  private checkIfValidOpcode(opcode: ASTNode) {

    if (typeof opcode.value !== "string") {
      throw new Error(`typeError - Expected string, but ${typeof opcode.value} was given`);
    }

    if (this.validOpcodes.includes(opcode.value)) { return true }

    throw new Error(`${opcode.value} is not a valid Opcode`);
  }


}
