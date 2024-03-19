import { Injectable } from '@angular/core';
import { ASTNode } from './macro-AST-Generator.service';
import { MacroError } from './MacroErrors';

@Injectable({
  providedIn: 'root'
})
export class SemanticCheckerService {

  private validOpcodes: string[] = [];
  private ast: ASTNode;
  private constantNames: string[] = [];
  private methodNames: string[] = [];

  constructor() { }


  checkSemantic(opcodes: { [opcode: string]: number }, ast: ASTNode) {
    this.init();
    this.validOpcodes = Object.keys(opcodes);
    this.ast = ast;
    this.checkForMainMethod();
    this.checkConstants();
    this.checkMethods();
  }

  private init() {
    this.constantNames = [];
    this.methodNames = [];
  }

  private checkForMainMethod() {
    const methodNode = this.ast.children[1]

    if (methodNode.children.length === 0) {
      throw new MacroError({name:"noEntryPointError", message:"The program has no main method. Add a main method by using '.main' ... '.end-main'", line: 1});
    }

    let hasMainMethod = false;
    for (let method of methodNode.children) {
      if (method.value === "main") {
        hasMainMethod = true;
        break;
      }
    }

    if (!hasMainMethod) {
      throw new MacroError({name:"noEntryPointError", message:"The program has no main method. Add a main method by using '.main' ... '.end-main'", line: 1});
    }

    if (methodNode.children[0].value !== "main" && hasMainMethod) {
      throw new Error("noEntryPointError - The first method of the program has to be the main method.");
    }
  }

  private checkConstants() {
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
    //Constants start with an alphabetic Character, followed by zero or more alphanumeric characters
    const matched = /^([a-zA-Z]([a-zA-Z0-9]*))/.exec(node.value);
    return matched !== null;
  }

  private checkMethods() {
    const allMethods = this.ast.children[1].children;

    this.createMethodNamesList(allMethods);

    for (let method of allMethods) {
      this.checkMethod(method);
    }
  }

  private createMethodNamesList(allMethods: ASTNode[]) {
    for (let method of allMethods) {
      this.checkMethodName(method.value);
    }
  }

  private checkMethod(methodNode: ASTNode) {

    const [opCodes, variables, labels, methodParameters] = methodNode.children;

    const localVariables = this.checkMethodVariables(variables);
    const localParameters = this.checkMethodParameters(methodParameters);
    const localLabels = this.checkMethodLabels(labels);

    for (let line of opCodes.children) {
      this.checkIfValidMethodLine(line, localVariables, localParameters, localLabels);
    }
  }


  private checkMethodName(name: string | number) {
    if (typeof name !== "string") {
      throw new Error(`typeError - Expected string, but ${typeof name} was given`);
    }
    if (this.methodNames.includes(name)) {
      throw new Error(`redefinitionError - method "${name}" was already declared`);
    }
    if (/^([a-zA-Z]([a-zA-Z0-9]*))/.exec(name) === null) {
      throw new Error(`syntaxError - "${name}" is not a valid method Identifier`);
    }
    this.methodNames.push(name);
  }

  private checkMethodVariables(variables: ASTNode): string[] {

    let localVariableNames: string[] = [];

    for (const variable of variables.children) {

      if (variable.children.length !== 1) {
        throw new Error(`syntaxError - in the variable block you can only define variables but not assign values`);
      }

      if (typeof variable.children[0].value !== "string") {
        throw new Error(`typeError - Expected string, but ${typeof variable.value} was given`);
      }

      const name = variable.children[0].value

      if (localVariableNames.includes(name)) {
        throw new Error(`redefinitionError - variable  "${name}" was already declared in this scope`);
      }

      if (this.constantNames.includes(name)) {
        throw new Error(`redefinitionError - variable identifier "${name}" was already declared as a constant`);
      }

      localVariableNames.push(name);
    }

    return localVariableNames;
  }

  private checkMethodParameters(parameters: ASTNode): string[] {
    let localParameterNames: string[] = [];
    for (let parameter of parameters.children) {

      if (typeof parameter.value !== "string") {
        throw new Error(`typeError - Expected string, but ${typeof parameter.value} was given`);
      }
      if (/^([a-zA-Z]([a-zA-Z0-9]*))/.exec(parameter.value) === null) {
        throw new Error(`syntaxError - "${parameter.value}" is not a valid identifier for a method parameter`);
      }
      if (this.constantNames.includes(parameter.value)) {
        throw new Error(`redefinitionError - parameter name "${parameter.value}" collides with a constant identifier`);
      }
      if (localParameterNames.includes(parameter.value)) {
        throw new Error(`redefinitionError - parameter name "${parameter.value}" was already declared in this scope`);
      }

      localParameterNames.push(parameter.value)
    }

    return localParameterNames;
  }

  private checkMethodLabels(labels: ASTNode): string[] {

    let localLabelNames: string[] = [];

    for (let label of labels.children) {

      if (typeof label.value !== "string") {
        throw new Error(`typeError - Expected string, but ${typeof label.value} was given`);
      }
      if (/^.*:/.exec(label.value) === null) {
        throw new Error(`syntaxError - "${label.value}" is not a valid Label declaration`);
      }

      const labelName = label.value.slice(0, -1);

      if (this.constantNames.includes(labelName)) {
        throw new Error(`redefinitionError - Label identifier "${labelName}" was already used as a constant identifier`);
      }
      if (this.validOpcodes.includes(labelName)) {
        throw new Error(`redefinitionError - Label  "${labelName}" overshadows an opcode in the Microprogram`);
      }
      if (localLabelNames.includes(labelName)) {
        throw new Error(`redefinitionError - Label "${labelName}" was already created in this scope`);
      }

      localLabelNames.push(labelName)
    }

    return localLabelNames;
  }

  private checkIfValidMethodLine(lineNode: ASTNode, localVariables: string[], localParameters: string[], localLabels: string[]) {

    const line = lineNode.children;

    if (line[0] === undefined) {
      throw new Error("emptyLineError");
    }

    this.checkIfValidOpcode(line[0]);

    const parameters = line[1];
    for (let parameter of parameters.children) {
      this.checkIfValidOpcodeParameter(parameter, localVariables, localParameters, localLabels);
    }

  }

  private checkIfValidOpcode(opcode: ASTNode) {

    if (typeof opcode.value !== "string") {
      throw new Error(`typeError - Expected string, but ${typeof opcode.value} was given`);
    }

    if (opcode.type !== "identifier") {
      throw new Error("syntaxError - A line must begin with an Opcode");
    }

    if (this.validOpcodes.includes(opcode.value)) { return }

    throw new Error(`${opcode.value} is not a valid Opcode`);
  }

  private checkIfValidOpcodeParameter(parameter: ASTNode, localVariables: string[], localParameters: string[], localLabels: string[],) {

    if (typeof parameter.value !== "string") {
      throw new Error(`typeError - Expected string, but ${typeof parameter.value} was given`);
    }

    const parameterValue = parameter.value;

    if (!isNaN(Number(parameterValue))) {
      this.checkIfValidNumericParameter(Number(parameterValue));
      return;
    }
    this.checkIfValidIdentifierParameter(parameterValue, localVariables, localParameters, localLabels)
  }

  private checkIfValidNumericParameter(number: number) {
    if (number < -128 || number > 127) {
      throw new Error(`syntaxError - number ${number} does not fit into a signed byte`)
    }
  }

  private checkIfValidIdentifierParameter(parameterValue: string, localVariables: string[], localParameters: string[], localLabels: string[]) {
    if (
      this.constantNames.includes(parameterValue) ||
      this.methodNames.includes(parameterValue) ||
      localVariables.includes(parameterValue) ||
      localParameters.includes(parameterValue) ||
      localLabels.includes(parameterValue)
    ) { return; }

    throw new Error(`undeclaredIdentifierError - identifier "${parameterValue}" was not declared in this scope`);
  }


}
