import { TestBed } from '@angular/core/testing';

import { RegProviderService } from './reg-provider.service';

describe('RegProviderService', () => {
  let service: RegProviderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegProviderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
