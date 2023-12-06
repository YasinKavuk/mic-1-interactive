import { TestBed } from '@angular/core/testing';

import { CharacterRomService } from './character-rom.service';

describe('CharacterRomService', () => {
  let service: CharacterRomService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CharacterRomService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
