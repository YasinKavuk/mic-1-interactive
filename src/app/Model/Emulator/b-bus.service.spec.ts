import { TestBed } from '@angular/core/testing';

import { BBusService } from './b-bus.service';

describe('BBusService', () => {
  let service: BBusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BBusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
