import { TestBed } from '@angular/core/testing';

import { MainMemoryService } from './main-memory.service';

describe('MainMemoryService', () => {
  let service: MainMemoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MainMemoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
