import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialDeComprasComponent } from './historial-de-compras.component';

describe('HistorialDeComprasComponent', () => {
  let component: HistorialDeComprasComponent;
  let fixture: ComponentFixture<HistorialDeComprasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialDeComprasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HistorialDeComprasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
