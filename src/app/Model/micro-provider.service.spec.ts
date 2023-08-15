import { TestBed } from '@angular/core/testing';

import { MicroProviderService } from './micro-provider.service';

describe('MicroProviderService', () => {
  let service: MicroProviderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MicroProviderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
