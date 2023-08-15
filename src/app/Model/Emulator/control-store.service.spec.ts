import { TestBed } from '@angular/core/testing';

import { ControlStoreService } from './control-store.service';

describe('ControlStoreService', () => {
  let service: ControlStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ControlStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
