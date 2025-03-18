import { TestBed } from '@angular/core/testing';

import { SolpeService } from './solpe.service';

describe('SolpeService', () => {
  let service: SolpeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SolpeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
