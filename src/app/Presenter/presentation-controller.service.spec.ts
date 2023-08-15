import { TestBed } from '@angular/core/testing';

import { PresentationControllerService } from './presentation-controller.service';

describe('PresentationControllerService', () => {
  let service: PresentationControllerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PresentationControllerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
