import { TestBed } from '@angular/core/testing';

import { CotizacionComparativaService } from './cotizacion-comparativa.service';

describe('CotizacionComparativaService', () => {
  let service: CotizacionComparativaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CotizacionComparativaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
