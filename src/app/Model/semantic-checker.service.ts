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
      throw new MacroError({ name: "noEntryPointError", message: "The program has no main method. Add a main method by using '.main' ... '.end-main'", line: 1 });
    }

    let hasMainMethod = false;
    for (let method of methodNode.children) {
      if (method.value === "main") {
        hasMainMethod = true;
        break;
      }
    }

    if (!hasMainMethod) {
      throw new MacroError({ name: "noEntryPointError", message: "The program has no main method. Add a main method by using '.main' ... '.end-main'", line: 1 });
    }

    if (methodNode.children[0].value !== "main" && hasMainMethod) {
      throw new MacroError({ name: "noEntryPointError", message: "The first method of the program has to be the main method.", line: 1 });
    }
  }

  private checkConstants() {
    const constants = this.ast.children[0];

    for (let constant of constants.children) {

      let editorLine = constant.editorLine;
      if (isNaN(Number(constant.editorLine))) {
        editorLine = 1;
      } else { editorLine = constant.editorLine }


      if (!this.isValidConstantIdentifier(constant.children[0])) {
        throw new MacroError({
          name: "syntaxError",
          message: "A constant needs an identifier and a value. E.g.: 'const 10'",
          line: editorLine
        });
      }

      if (constant.children.length !== 2) {
        throw new MacroError({
          name: "argumentError",
          message: `A constant needs exactly one argument, but ${constant.children.length - 1} were given`,
          line: editorLine
        });
      }

      if (typeof constant.children[0].value !== "string") {
        throw new MacroError({
          name: "typeError",
          message: `Expected string, but ${typeof constant.children[0].value} was given`,
          line: editorLine
        });
      }

      if (this.constantNames.includes(constant.children[0].value)) {
        throw new MacroError({
          name: "redefinitionError",
          message: `constant "${constant.children[0].value}" was already declared`,
          line: editorLine
        });
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

    const localParameters = this.checkMethodParameters(methodParameters);
    const localVariables = this.checkMethodVariables(variables, localParameters);
    const localLabels = this.checkMethodLabels(labels);

    for (let line of opCodes.children) {
      this.checkIfValidMethodLine(line, localVariables, localParameters, localLabels);
    }
  }


  private checkMethodName(name: string | number) {
    if (typeof name !== "string") {
      throw new MacroError({
        name: "typeError",
        message: `Expected string, but ${typeof name} was given`,
        line: 1
      });
    }
    if (this.methodNames.includes(name)) {
      throw new MacroError({
        name: "redefinitionError",
        message: `method "${name}" was already declared`,
        line: 1
      });
    }
    if (/^([a-zA-Z]([a-zA-Z0-9]*))/.exec(name) === null) {
      throw new MacroError({
        name: "syntaxError",
        message: `"${name}" is not a valid method Identifier`,
        line: 1
      });
    }
    this.methodNames.push(name);
  }

  private checkMethodVariables(variables: ASTNode, localParameters: string[]): string[] {

    let localVariableNames: string[] = [];

    for (const variable of variables.children) {

      if (variable.children.length !== 1) {
        throw new MacroError({
          name: "syntaxError",
          message: `in the variable block you can only define variables but not assign values`,
          line: 1
        });
      }

      if (typeof variable.children[0].value !== "string") {
        throw new MacroError({
          name: "typeError",
          message: `Expected string, but ${typeof variable.value} was given`,
          line: 1
        });
      }

      const name = variable.children[0].value

      if (localVariableNames.includes(name)) {
        throw new MacroError({
          name: "redefinitionError",
          message: `variable "${name}" was already declared in this scope`,
          line: 1
        });
      }

      if (this.constantNames.includes(name)) {
        throw new MacroError({
          name: "redefinitionError",
          message: `variable identifier "${name}" was already declared as a constant`,
          line: 1
        });
      }

      if (localParameters.includes(name)){
        throw new MacroError({
          name: "redefinitionError",
          message: `variable identifier "${name}" was already declared as a local parameter`,
          line: 1
        })
      }

      localVariableNames.push(name);
    }

    return localVariableNames;
  }

  private checkMethodParameters(parameters: ASTNode): string[] {
    let localParameterNames: string[] = [];
    for (let parameter of parameters.children) {

      if (typeof parameter.value !== "string") {
        throw new MacroError({
          name: "typeError",
          message: `Expected string, but ${typeof parameter.value} was given`,
          line: 1
        });
      }
      if (/^([a-zA-Z]([a-zA-Z0-9]*))/.exec(parameter.value) === null) {
        throw new MacroError({
          name: "syntaxError",
          message: `"${parameter.value}" is not a valid identifier for a method parameter`,
          line: 1
        });
      }
      if (this.constantNames.includes(parameter.value)) {
        throw new MacroError({
          name: "redefinitionError",
          message: `parameter name "${parameter.value}" collides with a constant identifier`,
          line: 1
        });
      }
      if (localParameterNames.includes(parameter.value)) {
        throw new MacroError({
          name: "redefinitionError",
          message: `parameter name "${parameter.value}" was already declared in this scope`,
          line: 1
        });
      }

      localParameterNames.push(parameter.value)
    }

    return localParameterNames;
  }

  private checkMethodLabels(labels: ASTNode): string[] {

    let localLabelNames: string[] = [];

    for (let label of labels.children) {

      if (typeof label.value !== "string") {
        throw new MacroError({
          name: "typeError",
          message: `Expected string, but ${typeof label.value} was given`,
          line: 1
        });
      }
      if (/^.*:/.exec(label.value) === null) {
        throw new MacroError({
          name: "syntaxError",
          message: `"${label.value}" is not a valid Label declaration`,
          line: 1
        });
      }

      const labelName = label.value.slice(0, -1);

      if (this.constantNames.includes(labelName)) {
        throw new MacroError({
          name: "redefinitionError",
          message: `Label identifier "${labelName}" was already used as a constant identifier`,
          line: 1
        });
      }
      if (this.validOpcodes.includes(labelName)) {
        throw new MacroError({
          name: "redefinitionError",
          message: `Label  "${labelName}" overshadows an opcode in the Microprogram`,
          line: 1
        });
      }
      if (localLabelNames.includes(labelName)) {
        throw new MacroError({
          name: "redefinitionError",
          message: `Label "${labelName}" was already created in this scope`,
          line: 1
        });
      }

      localLabelNames.push(labelName)
    }

    return localLabelNames;
  }

  private checkIfValidMethodLine(lineNode: ASTNode, localVariables: string[], localParameters: string[], localLabels: string[]) {

    const line = lineNode.children;
    let editorLine = 1;
    if (line[line.length - 1].type === "line") {
      editorLine = Number(line[line.length - 1].value);
    }

    if (line[0] === undefined) {
      throw new MacroError({ name: "emptyLineError", message: "line is null", line: editorLine });
    }

    this.checkIfValidOpcode(line[0], editorLine);

    const parameters = line[1];
    for (let parameter of parameters.children) {
      this.checkIfValidOpcodeParameter(parameter, localVariables, localParameters, localLabels, editorLine);
    }

  }

  private checkIfValidOpcode(opcode: ASTNode, editorLine: number) {

    if (typeof opcode.value !== "string") {
      throw new MacroError({
        name: "typeError",
        message: `Expected string, but ${typeof opcode.value} was given`,
        line: editorLine,
      })
    }

    if (opcode.type !== "identifier") {
      throw new MacroError({
        name: "syntaxError",
        message: `A line must begin with an Opcode`,
        line: editorLine,
      })
    }

    if (this.validOpcodes.includes(opcode.value)) { return }

    throw new MacroError({
      name: "syntaxError",
      message: `${opcode.value} is not a valid Opcode`,
      line: editorLine,
    })
  }

  private checkIfValidOpcodeParameter(parameter: ASTNode, localVariables: string[], localParameters: string[], localLabels: string[], editorLine: number) {

    if (typeof parameter.value !== "string") {
      throw new MacroError({
        name: "typeError",
        message: `Expected string, but ${typeof parameter.value} was given`,
        line: editorLine,
      })
    }

    const parameterValue = parameter.value;

    if (!isNaN(Number(parameterValue))) {
      this.checkIfValidNumericParameter(Number(parameterValue), editorLine);
      return;
    }
    this.checkIfValidIdentifierParameter(parameterValue, localVariables, localParameters, localLabels, editorLine)
  }

  private checkIfValidNumericParameter(number: number, editorLine: number) {
    if (number < -128 || number > 127) {
      throw new MacroError({
        name: "syntaxError",
        message: `number ${number} does not fit into a signed byte`,
        line: editorLine,
      })
    }
  }

  private checkIfValidIdentifierParameter(parameterValue: string, localVariables: string[], localParameters: string[], localLabels: string[], editorLine: number) {
    if (
      this.constantNames.includes(parameterValue) ||
      this.methodNames.includes(parameterValue) ||
      localVariables.includes(parameterValue) ||
      localParameters.includes(parameterValue) ||
      localLabels.includes(parameterValue)
    ) { return; }

    throw new MacroError({
      name: "undeclaredIdentifierError",
      message: `identifier "${parameterValue}" was not declared in this scope`,
      line: editorLine,
    })
  }


}
