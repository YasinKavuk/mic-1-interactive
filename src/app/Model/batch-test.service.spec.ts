import { TestBed } from '@angular/core/testing';

import { BatchTestService } from './batch-test.service';

describe('BatchTestService', () => {
  let service: BatchTestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BatchTestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
