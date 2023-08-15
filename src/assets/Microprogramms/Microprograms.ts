export class Microprogramms{
    micro: string = 
        `Main1: PC=PC+1; fetch; goto(MBR)
        
(0x00)NOP:; goto Main1

(0x10)BIPUSH: SP=MAR=SP+1;
    PC=PC+1; fetch
    MDR=TOS=MBR; wr; goto Main1;

(0x13)ISUB: MAR=SP=SP-1; rd
    H=TOS
    MDR=TOS=MDR-H; wr; goto Main1

(0x16)IAND: MAR=SP=SP-1; rd
    H=TOS
    MDR=TOS=MDR AND H; wr; goto Main1

(0x02)IOR:MAR=SP=SP-1; rd
    H=TOS
    MDR=TOS=MDR OR H; wr; goto Main1

(0x05)DUP: MAR = SP = SP+1
    MDR=TOS;wr;goto Main1

(0x57)POP: MAR=SP=SP-1; rd;
    pop1:   //wait
    TOS=MDR;goto Main1

(0x19)SWAP: MAR=SP-1; rd;
    MAR=SP
    H=MDR;wr
    MDR=TOS
    MAR=SP-1; wr
    TOS=H; goto Main1

(0x0D)IADD: MAR=SP=SP-1; rd
    H=TOS
    MDR=TOS=MDR+H; wr; goto Main1

(0x1F)ILOAD:H=LV;
    MAR=MBRU+H;rd;
    iload3: MAR=SP=SP+1;
    PC=PC+1; fetch; wr;
    TOS=MDR; goto Main1

(0x24)ISTORE: H=LV
    MAR=MBRU+H
    istore3: MDR=TOS;wr;
    SP=MAR=SP-1;rd
    PC=PC+1;fetch
    TOS=MDR; goto Main1

(0x2A)WIDE: PC=PC+1; fetch; goto(MBR or 0x100)

(0x2B)LDC_W: PC=PC+1; fetch;
    H=MBRU <<8
    H=MBRU OR H
    MAR=H+CPP; rd; goto iload3

(0x2F)IINC: H=LV
    MAR=MBRU+H; rd
    PC=PC+1; fetch
    H=MDR
    PC=PC+1; fetch
    MDR=MBR+H; wr; goto Main1
    
(0xA7)GOTO:OPC=PC-1
    goto2: PC=PC+1; fetch;
    H=MBR <<8
    H=MBRU OR H
    PC=OPC+H; fetch
    goto Main1

(0x09)IFLT: MAR=SP=SP-1; rd;
    OPC=TOS
    TOS=MDR
    N=OPC; if(N) goto T; else goto F

(0x35)IFEQ:MAR=SP=SP-1; rd;
    OPC=TOS
    TOS=MDR
    Z=OPC; if(Z) goto T; else goto F

(0x39)IF_ICMPEQ: MAR=SP=SP-1; rd
    MAR=SP=SP-1
    H=MDR;rd
    OPC=TOS
    TOS=MDR
    Z=OPC-H; if(Z) goto T; else goto F
    F:PC=PC+1
    PC=PC+1; fetch;
    goto Main1
    (0x13F)T:OPC=PC-1;fetch; goto goto2


    (0xB6)INVOKEVIRTUAL:PC=PC+1; fetch
    H=MBRU <<8
    H = MBRU OR H
    MAR=CPP + H; rd
    OPC = PC+1
    PC=MDR; fetch
    PC=PC+1; fetch
    H = MBRU <<8
    H = MBRU OR H
    PC=PC+1; fetch
    TOS=SP-H
    TOS=MAR=TOS+1
    PC=PC+1; fetch
    H = MBRU <<8
    H = MBRU OR H
    MDR = SP + H +1; wr
    MAR=SP=MDR
    MDR = OPC; wr
    MAR = SP = SP+1
    MDR = LV; wr
    PC=PC+1; fetch
    LV=TOS; goto Main1

(0xCC)IRETURN:MAR=SP=LV; rd
    ireturn1:   //wait
    LV=MAR=MDR; rd
    MAR=LV+1
    PC=MDR;rd;fetch
    MAR=SP
    LV=MDR
    MDR=TOS; wr; goto Main1`;

    constructor(){
        this.micro;
    }

    getMicro(){
        return this.micro;
    }
    
    setMicro(micro: string){
        this.micro = micro;
    }
}