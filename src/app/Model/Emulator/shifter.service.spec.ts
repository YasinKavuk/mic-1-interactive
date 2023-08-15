import { TestBed } from '@angular/core/testing';

import { ShifterService } from './shifter.service';

describe('ShifterService', () => {
  let service: ShifterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShifterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
