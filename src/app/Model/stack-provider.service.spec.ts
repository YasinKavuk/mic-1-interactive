import { TestBed } from '@angular/core/testing';

import { StackProviderService } from './stack-provider.service';

describe('StackProviderService', () => {
  let service: StackProviderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StackProviderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
