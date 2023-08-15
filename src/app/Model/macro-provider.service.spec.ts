import { TestBed } from '@angular/core/testing';

import { MacroProviderService } from './macro-provider.service';

describe('MacroProviderService', () => {
  let service: MacroProviderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MacroProviderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
