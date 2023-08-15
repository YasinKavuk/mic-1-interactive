import { TestBed } from '@angular/core/testing';

import { CBusService } from './c-bus.service';

describe('CBusService', () => {
  let service: CBusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CBusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
