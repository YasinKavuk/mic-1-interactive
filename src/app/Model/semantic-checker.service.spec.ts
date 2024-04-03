import { TestBed } from '@angular/core/testing';

import { SemanticCheckerService } from './semantic-checker.service';

describe('SemanticCheckerService', () => {
  let service: SemanticCheckerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SemanticCheckerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
