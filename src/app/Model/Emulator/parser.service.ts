import { Injectable } from '@angular/core';
import { RegProviderService } from '../reg-provider.service';
import { MicroTokenizerService } from '../micro-tokenizer.service';
import { Token } from '../micro-tokenizer.service';

export interface Instruction {
  addr: Array<number>;
  jam: Array<number>;
  alu: Array<number>;
  c: Array<number>;
  mem: Array<number>;
  b: Array<number>;
}

export interface Line {
  tokens: Token[];
  lineNumber: number;
}

@Injectable({
  providedIn: 'root'
})
export class ParserService {

  constructor(private RegisterProvider: RegProviderService) { }

  private microTokenizer = new MicroTokenizerService();
  private tokens: Token[];

  // jump labels and address
  public labels: { [id: string]: number } = {};

  public static print = true;

  // address of current instruction
  private address: number;

  addr = Array(9)
  jam = Array(3)
  alu = Array(8)
  c = Array(9)
  mem = Array(3)
  b = Array(4)



  private init(instruction: Token[], address: number) {

    this.tokens = instruction;
    this.address = address

    // set all output Bits to 0
    this.addr.fill(0);
    this.jam.fill(0);
    this.alu.fill(0);
    this.c.fill(0);
    this.mem.fill(0);
    this.b.fill(0);
  }


  parse(instruction: Token[], address: number): Instruction {

    this.init(instruction, address);

    if (this.tokens.length == 0) {
      throw new Error("EmptyInstructionError");
    }

    this.setAddr(this.address + 1);

    this.setCBus();

    this.setAlu();

    // goto and Memory Instructions are optional
    while (this.tokens.length != 0) {
      switch (this.tokens[0].type) {
        case "MEMORY_INSTRUCTION":
          this.setMemory();
          break;

        case "GOTO":
          this.goto();
          break;

        case "JUMP":
          this.setJam();
          break;

        default:
          throw new Error(`Unexpected Token: ${this.tokens[0].value}`);
      }

    }

    if (ParserService.print) {
      console.log(`Parser Output:
      Addr:  ${this.addr.join("")},
      JAM:   ${this.jam.join("")},
      Alu:   ${this.alu.join("")},
      C:     ${this.c.join("")},
      Mem:   ${this.mem.join("")},
      B:     ${this.b.join("")},
    `)
    }

    return { addr: [...this.addr], alu: [...this.alu], b: [...this.b], c: [...this.c], jam: [...this.jam], mem: [...this.mem] };
  }

  private setJam() {

    if (/^if\s*\(N\)/.test(this.tokens[0].value)) {
      // set JAMN bit
      this.jam[1] = 1;
    } else if (/^if\s*\(Z\)/.test(this.tokens[0].value)) {
      //set JAMZ bit
      this.jam[2] = 1;
    }

    // consume if(x) Token
    this.tokens.splice(0, 1);

    // consume goto Token
    if (this.tokens[0].type != "GOTO") {
      throw new Error(`Unexpected Token: ${this.tokens[0].value}, after if( ) must come "goto"`);
    }
    this.tokens = this.tokens.slice(1);

    if (!(this.tokens[0].type == "LABEL")) {
      throw new Error(`Unexpected Token: ${this.tokens[0].value}, expected a Label`);
    }

    // consume label Token
    this.tokens = this.tokens.slice(1);

    if (this.tokens[0].type != "DIVIDER") {
      throw new Error(`Unexpected Token: ${this.tokens[0].value}, expected ";"`);
    }
    //consume Divider
    this.tokens = this.tokens.slice(1);

    if (this.tokens[0].type != "ELSE" || this.tokens[1].type != "GOTO") {
      throw new Error(`Unexpected Tokens: ${this.tokens[0].value} ${this.tokens[0].value}, expected "else goto"`);
    }
    //consume "else goto" Tokens
    this.tokens = this.tokens.slice(2);

    if (this.tokens[0].type != "LABEL") {
      throw new Error(`Unexpected Token: ${this.tokens[0].value}, expected a Label`);
    }

    if (!(this.tokens[0].value in this.labels)) {
      throw new Error(`UnknownLabelError -  ${this.tokens[0].value} was never declared`);
    }
    this.addr.fill(0);
    this.setAddr(this.labels[this.tokens[0].value]);
    // consume Label Token
    this.tokens = this.tokens.slice(1);

    if (this.tokens.length == 0) { return; }
    if (this.tokens[0].type != "DIVIDER") { throw new Error(`Unexpected Token: ${this.tokens[0].value}, expected ";" or end of line`); }

    //consume Divider
    this.tokens.shift
  }

  private findNextDivider(): number {
    let dividerPos = 0
    for (let i = 0; i < this.tokens.length; i++) {
      if (this.tokens[i].type == "DIVIDER") {
        dividerPos = i;
        break;
      }
    }

    // Found no divider -> no other Operation after
    if (dividerPos == 0) {
      dividerPos = this.tokens.length - 1;
    }
    return dividerPos;
  }

  private setAddr(address: number) {
    let binaryString = ((address) >>> 0).toString(2);

    let cursor = 0;
    for (let i = this.addr.length - binaryString.length; i < this.addr.length; i++) {
      this.addr[i] = parseInt(binaryString[cursor]);
      cursor++;
    }

  }

  private goto() {
    // find next DIVIDER or end of Instruction
    let dividerPos = this.findNextDivider();

    // after Goto must come a LABEL or a Branch with MBR-Address
    let nextToken = this.tokens[1]
    if (nextToken.type == "LABEL") {
      // Overwrite nextAddress with the Address of the label
      this.addr.fill(0);
      if (nextToken.value in this.labels) {
        let nextAddress = this.labels[nextToken.value];
        this.setAddr(nextAddress);
      } else {

        throw new Error(`UnknownLabelError: Label "${nextToken.value}" is not defined`);
      }
    } else if (nextToken.type == "BRANCH_TO_MBR") {
      // Overwrite nextAddress with the Address in MBR
      let nextAddress = this.RegisterProvider.getRegister("MBR").getValue();
      this.addr.fill(0);
      this.setAddr(nextAddress);
    } else if (nextToken.type == "MULTIWAY_BRANCH_TO_MBR") {
      let number = parseInt(/0x[a-fA-F0-9]+/.exec(nextToken.value)[0]);
      // or number with MBR content
      let mbr = this.RegisterProvider.getRegister("MBR").getValue();
      let nextAddress = number | mbr;

      //set JMPC bit
      this.jam[0] = 1;

      // Overwrite nextAddress to new Address
      this.addr.fill(0);
      this.setAddr(nextAddress);

    } else {
      throw new Error(`Unexpected Token: ${nextToken.value}, expected a label or (MBR)`);
    }

    // consume Tokens
    this.tokens = this.tokens.slice(dividerPos + 1);
  }

  private setMemory() {
    // find DIVIDER or end of instruction
    let dividerPos = this.findNextDivider();

    const memoryInst: { [id: string]: number } = { "wr": 0, "rd": 1, "fetch": 2 };

    // set Mem Bit
    this.mem[memoryInst[this.tokens[0].value]] = 1;

    // consume Tokens
    this.tokens = this.tokens.slice(dividerPos + 1);

  }

  private setAlu() {

    // find DIVIDER or end of instruction
    let dividerPos = this.findNextDivider();
    if (this.tokens[0].type === "DIVIDER") {
      this.alu = [0, 0, 0, 1, 0, 0, 0, 0];
      // consume Divider Token
      this.tokens = this.tokens.slice(dividerPos + 1);
      return;
    } else if (this.tokens[0].type === "GOTO") {
      this.alu = [0, 0, 0, 1, 0, 0, 0, 0];
      return;
    }



    // we can either have zero, one or two Registers in the Alu-Instruction
    let aluInstruction = this.tokens.slice(0, dividerPos + 1);
    let registerAmount = aluInstruction.filter(x => x.type == "REGISTER").length




    // split shifter and Alu instructions
    let shifterInstruction: Token[] = [];
    for (let i = 0; i < aluInstruction.length; i++) {

      if (aluInstruction[i].type == "BITWISE_OPERATOR") {
        // shifter Instruction has to be at the end of the AluInstruction
        if (aluInstruction.length - i <= 3) {
          shifterInstruction = aluInstruction.splice(i, 2);
          break;
        } else {
          throw new Error("InvalidAluInstruction - Shifter Operation must come at the end of the Alu Instruction")
        }


      }
    }


    switch (registerAmount) {
      case 0:
        this.aluCase0Reg(aluInstruction);
        break;

      case 1:
        this.aluCase1Reg(aluInstruction);
        break;

      case 2:
        this.aluCase2Reg(aluInstruction);
        break;

      default:
        throw new Error("InvalidAluInstruction - The ALU can only use a maximum of two registers");
    }

    // check for shifter instruction
    if (shifterInstruction.length == 2) {
      // Logical Left Shift
      if (shifterInstruction[0].value == "<<") {
        if (shifterInstruction[1].value == "8") {
          this.alu[0] = 1;
        } else {
          throw new Error("InvalidAluInstruction - the only valid logical left shift is by 8 bits");
        }
      }

      // Arithmetic right shift
      if (shifterInstruction[0].value == ">>") {
        if (shifterInstruction[1].value == "1") {
          this.alu[1] = 1;
        } else {
          throw new Error("InvalidAluInstruction - the only valid arithmetic right shift is one bit only");
        }
      }
    }

    // consume Tokens
    this.tokens = this.tokens.slice(dividerPos + 1);
  }

  private aluCase0Reg(aluInstruction: Token[]) {
    // Alu Instructions without any Registers can either be "0" , "1" or "-1".

    // check for sign (+/-)
    if (aluInstruction[0].type == "ADDITIVE_OPERATOR") {
      // - -> can only be "-1" instruction
      if (aluInstruction[0].value == "-") {
        if (aluInstruction[1].value == "1") {
          this.alu = [0, 0, 1, 1, 0, 0, 1, 0];
          return;
        } else { throw new Error("InvalidAluInstruction"); }
        // + -> remove unnecessary sign
      } else { aluInstruction.shift(); }
    }

    // 0
    if (aluInstruction[0].value == "0") {
      this.alu = [0, 0, 0, 1, 0, 0, 0, 0];
      return;
    }

    // 1
    if (aluInstruction[0].value == "1") {
      this.alu = [0, 0, 1, 1, 0, 0, 0, 1];
      return;
    }

    throw new Error("InvalidAluInstruction");
  }

  private aluCase1Reg(aluInstruction: Token[]) {
    // Alu instructions with one Register can be "A", "B", "-A", "A+1", "B+1" or "B-1".

    if (aluInstruction.length > 4) { throw new Error("InvalidAluInstruction"); }

    // Check of sign (+/-)
    if (aluInstruction[0].type == "ADDITIVE_OPERATOR") {
      // - -> can only be "-A" instruction
      if (aluInstruction[0].value == "-") {
        if (aluInstruction[1].value == "H") {
          this.alu = [0, 0, 1, 1, 1, 0, 1, 1,];
          return;
        } else { throw new Error('InvalidAluInstruction - only valid subtraction is "-H" or "-1" '); }
        // + -> remove unnecessary sign
      } else { aluInstruction.shift(); }
    }

    // first Operand must be a Register or a one
    if (aluInstruction[0].type != "REGISTER" && aluInstruction[0].value != "1") {
      throw new Error("InvalidAluInstruction");
    }


    if (aluInstruction.length > 2) {
      // B-1
      if (aluInstruction[1].value == "-" && aluInstruction[2].value == "1") {
        this.alu = [0, 0, 1, 1, 0, 1, 1, 0];
        this.setBBus(aluInstruction[0].value);
        return;
      }

      if (aluInstruction[1].value != "+") { throw new Error("InvalidAluInstruction"); }

      // A + 1 || 1 + A
      if (aluInstruction[0].value == "H" || aluInstruction[2].value == "H") {
        if (aluInstruction[0].value != "1" && aluInstruction[2].value != "1") {
          throw new Error("InvalidAluInstruction - can only add one");
        }
        this.alu = [0, 0, 1, 1, 1, 0, 0, 1];
        return;
      }

      // B + 1 || 1 + B
      if (aluInstruction[0].value == "1" || aluInstruction[2].value == "1") {
        this.alu = [0, 0, 1, 1, 0, 1, 0, 1];
        aluInstruction[0].type == "REGISTER" ? this.setBBus(aluInstruction[0].value) : this.setBBus(aluInstruction[2].value);
        return;
      }
    }

    // A
    if (aluInstruction[0].value == "H" && aluInstruction.length <= 2) {
      this.alu = [0, 0, 0, 1, 1, 0, 0, 0];
      return;
    }


    // B
    this.alu = [0, 0, 0, 1, 0, 1, 0, 0];
    this.setBBus(aluInstruction[0].value);

    if (aluInstruction.length == 1) {
      return;
    }

    if (aluInstruction[1].type != "DIVIDER") {
      throw new Error("InvalidAluInstruction");
    }

  }

  private aluCase2Reg(aluInstruction: Token[]) {
    // Alu instructions with two registers can be "A+B", "A+B+1", "B-A", "A AND B" or "A OR B"

    if (aluInstruction[0].type != "REGISTER" && aluInstruction[0].value != "1") { throw new Error("InvalidAluInstruction"); }

    // A+B+1
    if (aluInstruction.length > 4) {
      let one = false;
      let h = false;
      let reg = false;
      for (let i = 0; i < aluInstruction.length; i++) {

        // ignore "+" but "-" can not occur
        if (aluInstruction[i].type == "ADDITIVE_OPERATOR") {
          if (aluInstruction[i].value == "+") { continue; }
          throw new Error("InvalidAluInstruction - can not use '-' in this context");
        }

        // ignore Divider
        if (aluInstruction[i].type == "DIVIDER") { continue; }

        // The "+1" can only occur once
        if (aluInstruction[i].value == "1") {
          if (!one) { one = true; }
          else { throw new Error("InvalidAluInstruction - can only do '+1' once per ALU-instruction"); }
          continue;
        }

        // H register can only occur once
        if (aluInstruction[i].value == "H") {
          if (!h) { h = true; }
          else { throw new Error("InvalidAluInstruction - H Register can only occur once"); }
          continue;
        }

        // Other register can only occur once
        if (aluInstruction[i].value != "1" && aluInstruction[i].value != "H") {
          if (!reg) {
            reg = true;
            this.setBBus(aluInstruction[i].value);
          } else { throw new Error("InvalidAluInstruction - ALU can only calculate with one B-Bus Register per instruction"); }
        }

      }
      if (!one || !h || !reg) { throw new Error("InvalidAluInstruction"); }
      this.alu = [0, 0, 1, 1, 1, 1, 0, 1];
      return;
    }

    // Instructions with one operator
    let h = false;
    let reg = false;
    let op = false;
    for (let i = 0; i < aluInstruction.length; i++) {
      // ignore Divider
      if (aluInstruction[i].type == "DIVIDER") { continue; }

      // Logical Operations
      if (aluInstruction[i].type == "LOGICAL_OPERATOR") {
        if (!op) { op = true; }
        else { throw new Error("InvalidAluInstruction - to many Operators in this Alu-instruction") }

        // A AND B
        if (aluInstruction[i].value == "AND") {
          this.alu = [0, 0, 0, 0, 1, 1, 0, 0];
          continue;
        }

        // A OR B
        if (aluInstruction[i].value == "OR") {
          this.alu = [0, 0, 0, 1, 1, 1, 0, 0];
          continue;
        }
        throw new Error("InvalidAluInstruction");
      }

      // Additive Operators
      if (aluInstruction[i].type == "ADDITIVE_OPERATOR") {
        if (!op) { op = true; }
        else { throw new Error("InvalidAluInstruction - to many Operators in this Alu-instruction") }

        // A+B
        if (aluInstruction[i].value == "+") {
          this.alu = [0, 0, 1, 1, 1, 1, 0, 0];
          continue;
        }

        // B-A
        // right operator has to be the H Register
        if (aluInstruction[i + 1].value != "H") { throw new Error("InvalidAluInstruction - only valid subtrahends are H or 1") }
        this.alu = [0, 0, 1, 1, 1, 1, 1, 1,];
      }

      // H Register can only occur once
      if (aluInstruction[i].value == "H") {
        if (!h) {
          h = true;
          continue;
        } else { throw new Error("InvalidAluInstruction - H Register can only be used once per Alu-instruction") }
      }

      // B-Bus Register can occur only once
      if (aluInstruction[i].type == "REGISTER") {
        if (!reg) {
          reg = true;
          this.setBBus(aluInstruction[i].value);
          continue;
        } else { throw new Error("InvalidAluInstruction - ALU can only calculate with one B-Bus Register per instruction") }
      }
    }

  }

  private setBBus(register: string) {
    const regEncoding: { [id: string]: number[] } = {
      "MDR": [0, 0, 0, 0], "PC": [0, 0, 0, 1], "MBR": [0, 0, 1, 0], "MBRU": [0, 0, 1, 1],
      "SP": [0, 1, 0, 0], "LV": [0, 1, 0, 1], "CPP": [0, 1, 1, 0], "TOS": [0, 1, 1, 1], "OPC": [1, 0, 0, 0]
    }

    if (register in regEncoding) {
      this.b = regEncoding[register];
      return;
    }
    throw new Error("UnknownRegister - " + register + " is not a valid B-Bus register");


  }

  private setCBus() {

    // c-bus Bits -> find last Assignment -> instruction to the left are c-bus instructions
    let pos = 0
    let foundAssignment = false;
    for (let i = 0; i < this.tokens.length; i++) {
      if (this.tokens[i].type == "ASSIGNMENT_OPERATOR") {
        pos = i;
        foundAssignment = true;
      }
    }

    if (!foundAssignment) {
      this.c.fill(0);
      return // not tokens to consume
    }

    // all registers than can be written
    const registers: { [id: string]: number } = { "H": 0, "OPC": 1, "TOS": 2, "CPP": 3, "LV": 4, "SP": 5, "PC": 6, "MDR": 7, "MAR": 8 }

    let nextToken: Token;
    for (let i = 0; i <= pos; i++) {
      nextToken = this.tokens[i];

      // all even indexes must be Registers
      if (i % 2 == 0) {
        if (nextToken.type == "REGISTER") {
          // ignore Z and N
          if (nextToken.value == "Z" || nextToken.value == "N") { continue; }
          this.c[registers[nextToken.value]] = 1;
        } else {
          throw new Error(`Unexpected Token: ${nextToken.value}`);

        }
        // all odd indexes must be Assignments
      } else {
        if (nextToken.type != "ASSIGNMENT_OPERATOR") {
          throw new Error(`Unexpected Token: ${nextToken.value}`);
        }
      }
    }
    // consume tokens
    this.tokens = this.tokens.slice(pos + 1);
  }

  private newLabel(tokens: Token[], addr: number): string {

    if (tokens[0].type == "NEW_LABEL") {

      // consume first Token and remove ":" from Label
      let labelName = tokens.shift().value.slice(0, -1);

      //check if Label already exists -> Error
      if (labelName in this.labels) {
        throw new Error(`DuplicateLabelError - Label "${labelName}" already exists`);
      }

      // create new label
      this.labels[labelName] = addr;
      return labelName;
    }
    return "";
  }



  /**
   * Find the Address for each micro-instruction and create Labels (if given)
   * @param input - Array of Instruction Strings
   * @return dictionary with addresses and Array with Tokens
   * */
  public index(input: string[]): { [address: number]: Line } {
    let tokens: Token[][] = [];
    let lastAddress = 0;
    let microprogram: { [address: number]: Line } = {};  // { [address: number]: Token[] }

    interface Block { labelName: string, length: number };


    let blocks: Block[] = [];
    let block: Block = { labelName: "", length: 0 };


    // tokenize all lines
    for (let i = 0; i < input.length; i++) {
      tokens[i] = this.microTokenizer.getAllTokens(input[i]);
    }

    // find the address for each instruction and (if given) create a Label
    for (let i = 0; i < tokens.length; i++) {
      let line = tokens[i]

      // skip empty lines
      if (line.length == 0 || tokens.length == 0) { continue; }

      // if instruction has given Address, e.g (0xF7) -> take it
      if (line[0].type == "ADDRESS") {
        const match = /[a-fA-F0-9]{2,3}/.exec(line[0].value);
        if (match == null) {
          throw new Error(`Unexpected token: ${line[0].value}`);
        }
        let address = parseInt(match[0], 16);
        line.shift(); //consume token
        microprogram[address] = { tokens: line, lineNumber: i + 1 };

        let labelName = this.newLabel(line, address);

        if (labelName) {
          blocks.push(block);
          block = { labelName: labelName, length: 1 };
        }


        lastAddress = address;
        continue;
      }

      // if there is no given Address take last Address + 1
      microprogram[lastAddress + 1] = { tokens: line, lineNumber: i + 1 };
      lastAddress++;

      let labelName = this.newLabel(line, lastAddress);
      if (labelName) {
        blocks.push(block);
        block = { labelName: labelName, length: 1 };
        continue;
      }

      block.length = block.length + 1;
    }


    // assure that "if labels" are 256 bit apart
    for (let line of tokens) {
      for (let i = 0; i < line.length; i++) {
        if (line[i].type === "JUMP") {
          if (line[i + 2].type === "LABEL" && line[i + 6].type === "LABEL") {

            const baseLabelName = line[i + 6].value;
            const jumpLabelName = line[i + 2].value;


            const baseAddress = this.labels[baseLabelName];
            let jumpAddress = this.labels[jumpLabelName];


            if (baseAddress + 256 !== jumpAddress) {
              this.labels[jumpLabelName] = baseAddress + 256
              console.log("Moved Label", jumpLabelName, "from", jumpAddress, "to address", baseAddress + 256)


              // move all instruction in the "label Block"
              const BlockLength = blocks.find(x => x.labelName === jumpLabelName).length;
              for (let j = 0; j < BlockLength; j++) {
                let micro = microprogram[jumpAddress + j]
                delete microprogram[jumpAddress + j];
                microprogram[baseAddress + j + 256] = micro;
              }
            }
          }

        }
      }

    }

    console.table(this.labels);
    return microprogram;

  }
}
