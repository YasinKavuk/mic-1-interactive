import { TestBed } from '@angular/core/testing';

import { InterruptService } from './interrupt.service';

describe('InterruptService', () => {
  let service: InterruptService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InterruptService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
