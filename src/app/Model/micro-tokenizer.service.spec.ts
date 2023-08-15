import { TestBed } from '@angular/core/testing';

import { MicroTokenizerService } from './micro-tokenizer.service';

describe('MicroTokenizerService', () => {
  let service: MicroTokenizerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MicroTokenizerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
