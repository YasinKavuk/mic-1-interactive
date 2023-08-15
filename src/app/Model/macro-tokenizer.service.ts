import { Injectable } from '@angular/core';
import { MacroProviderService } from './macro-provider.service';
import { Token } from './micro-tokenizer.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})


export class MacroTokenizerService {
  Spec: any= [
    // New Label: e.g Label1:
    [/^.*:/ , "NEW_LABEL"],

    // Whitespace
    [/^\s+/, null],

    // Comment
    [/^\/\/.*/, null],

    // Numbers:
    [/^0x[a-fA-F0-9]+/, "Hex_Number"],
    [/^\d+/, "NUMBER"],

    // Mnemonics
    [/^([A-Z]+(_[A-Z]+)*(( 0x[a-fA-F0-9]+)|( (-)?\d+)|( [a-zA-Z0-9]+)|( [a-z]([a-zA-Z0-9]+))|( [a-zA-Z]([a-zA-Z0-9]+)))*)/, "MNEMONIC"],

    //Fields
    [/^.constant/, "FIELD"],
    [/^.main/, "FIELD"],
    [/^.var/, "FIELD"],
    [/^.method [a-zA-Z]([a-zA-Z0-9]+)?\(([a-z]([a-zA-Z0-9]+)?(, )?)*\)/, "FIELD"],

    //End Fields
    [/^.end-constant/, "FIELDEND"],
    [/^.end-main/, "FIELDEND"],
    [/^.end-var/, "FIELDEND"],
    [/^.end-method/, "FIELDEND"],

    //Constant & Variable
    [/^[a-z]([a-zA-Z0-9]+)? (-)?\d+/, "NEW_CONSTANT"],
    [/^[a-z]([a-zA-Z0-9]+)?/, "NEW_VARIABLE"],
  ];


  private string: string = "";
  private curser: number = 0;

  private token: Token = null;
  private tokens: Token[] = [];

  private _errorFlasher = new BehaviorSubject({ line: 0, error: "" });
  public errorFlasher$ = this._errorFlasher.asObservable();


  constructor(
    private macroProvider: MacroProviderService,
  ) { }


  init(){
    this.tokens = [];
    this.string = this.macroProvider.getMacro();
    while(true){
      this.token = this.getNextToken();
      if(this.token == null){
        break;
      }
      console.log(this.token);
      this.tokens.push(this.token);
    }
    this.resetTokenizer();
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

    for (const [regexp, tokenType] of this.Spec){
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

  resetTokenizer(){
    this.string = "";
    this.curser = 0;
  }

  getTokens(){
    return this.tokens;
  }

}
