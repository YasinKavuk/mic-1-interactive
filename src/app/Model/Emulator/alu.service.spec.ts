import { TestBed } from '@angular/core/testing';

import { AluService } from './alu.service';

describe('AluService', () => {
  let service: AluService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AluService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
