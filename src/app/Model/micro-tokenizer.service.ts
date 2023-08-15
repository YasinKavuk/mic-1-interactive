import { Injectable } from '@angular/core';


const Spec: any= [
  // Numbers:
  [/^\d+/, "NUMBER"],

  // New Label: e.g Label1:
  [/^\w+:/ , "NEW_LABEL"],

  // Registers
  [/^H/,     "REGISTER"],
  [/^MAR/,   "REGISTER"],
  [/^MDR/,   "REGISTER"],
  [/^SP/,    "REGISTER"],
  [/^LV/,    "REGISTER"],
  [/^CPP/,   "REGISTER"],
  [/^TOS/,   "REGISTER"],
  [/^OPC/,   "REGISTER"],
  [/^PC/,    "REGISTER"],
  [/^MBRU/,  "REGISTER"],
  [/^MBR/,   "REGISTER"],
  [/^Z/,     "REGISTER"],
  [/^N/,     "REGISTER"],


  // Math operators: +/-, AND, OR, >>
  [/^[+\-]/, "ADDITIVE_OPERATOR"],
  [/^AND/, "LOGICAL_OPERATOR"],
  [/^OR/, "LOGICAL_OPERATOR"],
  [/^<</, "BITWISE_OPERATOR"],
  [/^>>/, "BITWISE_OPERATOR"],

  // Assignment operator: =
  [/^=/, "ASSIGNMENT_OPERATOR"],

  // Memory operations: rd, wr, fetch
  [/^rd/, "MEMORY_INSTRUCTION"],
  [/^wr/, "MEMORY_INSTRUCTION"],
  [/^fetch/, "MEMORY_INSTRUCTION"],

  // if else
  [/^if\s*\(N\)/ , "JUMP"],
  [/^if\s*\(Z\)/ , "JUMP"],
  [/^else/ , "ELSE"],

  // Jump to Register Address, e.g: goto (MBR)
  [/^\(MBR\)/, "BRANCH_TO_MBR"],

  // Multiway branch with Register Address, e.g: goto (MBR or 0x100)
  [/^\(MBR or 0x[a-fA-F0-9]+\)/, "MULTIWAY_BRANCH_TO_MBR"],

  // Addresses: e.g (0x7F)
  [/^\(0x[a-fA-F0-9]+\)/, "ADDRESS"],
  
  // Divider: ;
  [/^;/, "DIVIDER"],

  // Whitespace
  [/^\s+/,    null],

  // Comment
  [/^\/\/.*/, null],

  [/^goto2/, "LABEL"],

  // Goto
  [/^goto/, "GOTO"],

  // Jump Label
  [/^\w+/, "LABEL"]
]

export interface Token{
  type: string;
  value: string;
}


@Injectable({
  providedIn: 'root'
})

export class MicroTokenizerService {

  private string: string = "";
  private curser: number = 0; 

  constructor() { }

  private init(string:string): void{
      this.string = string
      this.curser = 0;
  }

  private hasMoreTokens(): Boolean {
      return this.curser < this.string.length;
  }

  private match(regexp: RegExp, string: string){
      const matched = regexp.exec(string);
      if (matched == null){
          return null
      }
      this.curser += matched[0].length;
      return matched[0];
  }
   
  getNextToken():Token{
    if (!this.hasMoreTokens()){
      return null;
    }

    const string = this.string.slice(this.curser);

    for (const [regexp, tokenType] of Spec){
      const tokenValue = this.match(regexp, string);

      // could not match this rule, try the other ones
      if (tokenValue == null) {
         continue;
      }
            
      // Skip null Token, e.g whitespace and comment
      if (tokenType == null) {
        return this.getNextToken();
      }

      return{
        type: tokenType,
        value: tokenValue,
      }
    }

    throw new SyntaxError(`Unexpected token: "${string[0]}"`); 
  }

  getAllTokens(string:string):Token[]{
    this.init(string);
    let tokens: Token[] = [];
    while(true){
      let token = this.getNextToken();
      if(token == null){
        break;
      }
      tokens.push(token);
    }
    return tokens;
  }

}
