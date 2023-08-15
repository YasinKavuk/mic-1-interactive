import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MacroProviderService {
  private macro: string = "";
  macroGotChanged: boolean = false;

  constructor() {
    
  }

  setMacro(macro: string){
    this.macroGotChanged = true;
    this.macro = macro;

    localStorage.setItem("macroCode", macro);
  }

  getMacro(){
    return this.macro;
  }

  isLoaded(){
    this.macroGotChanged = false;
  }

  getMacroGotChanged(){
    return this.macroGotChanged;
  }

  printMacro(){
    console.log(this.macro);
  }

  getEditorLineWithParserLine(parserLine: number){
    let emptyRowCounter = 0;
    let line = 1;
    for(let i = 0; i < this.macro.length; i++){
      if(this.macro.charAt(i) === '\n' && (this.macro.charAt(i-1) === '\n' || i-1 < 1)){
        emptyRowCounter++;
      }
      else if(this.macro.charAt(i) === '/' && this.macro.charAt(i-1) === '/' && this.macro.charAt(i-2) === '\n'){
        emptyRowCounter++;
        line--;
      }
      else{
        if(this.macro.charAt(i) === '\n'){
          line++;
        }
      }
      
      if(line === parserLine){
        if(this.macro.charAt(i) === '\n'){
          let j = i;
          for(j; j < this.macro.length; j++){
            if(this.macro.charAt(j) === '\n' && this.macro.charAt(j+1) === '\n'){
              emptyRowCounter++;
            }
            if(this.macro.charAt(j) === '\n' && this.macro.charAt(j+1) !== '\n'){
              break
            }
          }
        }
        console.log("Editor line: " + (line + emptyRowCounter))
        break;
      }
    }

    return line + emptyRowCounter;
  }

  getEditorLineWithoutEmptyRows(lineWithEmptyRows: number){
    let emptyRowCounter = 0;
    let line = 1;
    for(let i = 0; i < this.macro.length; i++){
      if(this.macro.charAt(i) === '\n' && (this.macro.charAt(i-1) === '\n' || i-1 < 1)){
        emptyRowCounter++;
      }
      else if(this.macro.charAt(i) === '/' && this.macro.charAt(i-1) === '/' && this.macro.charAt(i-2) === '\n'){
        emptyRowCounter++;
        line--;
      }
      else{
        if(this.macro.charAt(i) === '\n'){
          line++;
        }
      }
      
      if(line === lineWithEmptyRows - emptyRowCounter){
        break;
      }
    }

    return lineWithEmptyRows - emptyRowCounter;
  }
}
