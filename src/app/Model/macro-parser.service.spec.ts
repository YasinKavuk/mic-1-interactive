import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { MacroParserService } from './macro-parser.service';

describe('MacroParserService', () => {
  let service: MacroParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MacroParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

});

