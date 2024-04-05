import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { MacroASTGeneratorService } from './macro-AST-Generator.service'; }
import { MacroTokenizerService } from './macro-tokenizer.service';
import { MainMemoryService } from './Emulator/main-memory.service';
import { ControlStoreService } from './Emulator/control-store.service';
import { PresentationControllerService } from '../Presenter/presentation-controller.service';


describe('MacroParserService', () => {
  let service: MacroASTGeneratorService;
  let macroTokenizer: MacroTokenizerService
  let memory: MainMemoryService
  let controlStore: ControlStoreService
  let presentationController: PresentationControllerService

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MacroASTGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

      // Resets all instance variables to their default values.
      it('should reset all instance variables to their default values', function() {
        const macroParser = new MacroASTGeneratorService(macroTokenizer, memory, controlStore, presentationController);
        service.tokens = null;
        service.constantOffsetToCPP = { constant: 1 };
        service.variableOffsetToLV = { variable: 2 };
        service.labels = { label: 3 };
        service.methods = { method: 4 };
        service.methodsParameterNumber = { methodParam: 5 };
        service.lineToLastUsedAddress = { 3: 6 };
        service.addrToOffset = { 11: 19 };
        service.methodToAddr = { 1: 8 };
        service.parsedCode = [9];
        service.constants = [10];
        service.variables = [11];
        service.varNumber = 12;
        service.constNumber = 13;
        service.parsedTokenNumber = 14;
        service.methodNumber = 15;
        service.currentLocalVarCount = 16;
        service.currentLine = 17;
  
        service.resetParser();
  
        expect(service.tokens).toBeNull();
        expect(service.constantOffsetToCPP).toEqual({});
        expect(service.variableOffsetToLV).toEqual({});
        expect(service.labels).toEqual({});
        expect(service.methods).toEqual({});
        expect(service.methodsParameterNumber).toEqual({});
        expect(service.lineToLastUsedAddress).toEqual({});
        expect(service.addrToOffset).toEqual({});
        expect(service.methodToAddr).toEqual({});
        expect(service.parsedCode).toEqual([]);
        expect(service.constants).toEqual([]);
        expect(service.variables).toEqual([]);
        expect(service.varNumber).toBe(0);
        expect(service.constNumber).toBe(0);
        expect(service.parsedTokenNumber).toBe(0);
        expect(service.methodNumber).toBe(0);
        expect(service.currentLocalVarCount).toBe(0);
        expect(service.currentLine).toBe(1);
      });

});

