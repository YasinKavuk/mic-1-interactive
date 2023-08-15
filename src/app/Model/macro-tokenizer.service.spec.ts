import { TestBed } from '@angular/core/testing';

import { MacroTokenizerService } from './macro-tokenizer.service';

describe('InterpreterService', () => {
  let service: MacroTokenizerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MacroTokenizerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
