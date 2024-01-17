import { Injectable } from '@angular/core';
import { MacroProviderService } from './macro-provider.service';
import { BehaviorSubject } from 'rxjs';


const spec: any = [
  // New Label: e.g Label1:
  [/^.*:/ , "NEW_LABEL"],

  // Comment
  [/^\/\/.*/, "COMMENT"],

  // Operation code, identifiers and numbers
  [/^[A-Z]+(_[A-Z]+)*/, "OPCODE"],
  [/^(0x[a-fA-F0-9]+)/, "HEXNUMBER"],
  [/^((-)?\d+)/, "NUMBER"],
  [/^([a-z]([a-zA-Z0-9]+))/, "IDENTIFIER"],

  //Fields
  [/^.constant/, "FIELD_CONST"],
  [/^.main/, "FIELD_MAIN"],
  [/^.var/, "FIELD_VAR"],
  [/^.method [a-zA-Z]([a-zA-Z0-9]+)?\(([a-z]([a-zA-Z0-9]+)?(, )?)*\)/, "FIELD_METH"],

  //End Fields
  [/^.end-constant/, "FIELDEND_CONST"],
  [/^.end-main/, "FIELDEND_MAIN"],
  [/^.end-var/, "FIELDEND_VAR"],
  [/^.end-method/, "FIELDEND_METH"],

  //Constant & Variable
  [/^[a-z]([a-zA-Z0-9]+)? (-)?\d+/, "NEW_CONSTANT"],
  [/^[a-z]([a-zA-Z0-9]+)?/, "NEW_VARIABLE"],

  [/^\n/, "BREAK"],
  [/^\s/, "SPACE"]
];

export interface Token{
  type: string;
  value: string;
  line: number;
}

@Injectable({
  providedIn: 'root'
})


export class MacroTokenizerService {
  
  private string: string = "";
  private curser: number = 0;

  private token: Token = null;
  private tokens: Token[] = [];

  private line: number = 1;

  private _errorFlasher = new BehaviorSubject({ line: 0, error: "" });
  public errorFlasher$ = this._errorFlasher.asObservable();


  constructor(
    private macroProvider: MacroProviderService,
  ) { }


  // Is a Lexer that tokenizes the input string from the editor and creates tokens. This tokens also have some context like "number" or "opcode" attached. The tokens also include the line number from the input string for each token generated.
  tokenize(){
    this.tokens = [];
    this.string = this.macroProvider.getMacro();
    while(true){
      this.token = this.getNextToken();
      if(this.token == null){
        break;
      }
      // console.log(this.token);
      this.tokens.push(this.token);
    }
    this.resetTokenizer();
    console.table(this.tokens)
    
    return this.tokens
  }

  // initialized the tokenizer and also tokenizes. It isn't using the program in the editors, it uses macrocode that is passed to this method
  tokenizeWithFile(macro: string){
    this.tokens = [];
    this.string = macro;

    while(true){
      this.token = this.getNextToken();
      if(this.token == null){
        break;
      }
      console.log(this.token);
      this.tokens.push(this.token);
    }
    this.resetTokenizer();

    return this.tokens;
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

  getNextToken(): Token{
    if (!this.hasMoreTokens()){
      return null;
    }

    const string = this.string.slice(this.curser);

    for (const [regexp, tokenType] of spec){
      const tokenValue = this.match(regexp, string);

      // could not match this rule, try the other ones
      if (tokenValue == null) {
        continue;
      }

      // Skip null Token, e.g whitespace and comment
      if (tokenType == null) {
        return this.getNextToken();
      }
      else if(tokenType == "BREAK"){
        this.line++;
        return this.getNextToken();
      }
      else if(tokenType == "SPACE"){
        return this.getNextToken();
      }

      return{
        type: tokenType,
        value: tokenValue,
        line: this.line,
      }
    }

    throw new SyntaxError(`Unexpected token: "${string[0]}"`);
  }

  resetTokenizer(){
    this.string = "";
    this.curser = 0;
    this.line = 1;
  }

  getTokens(){
    return this.tokens;
  }

}
