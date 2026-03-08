import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerDetallesProductoComponent } from './ver-detalles-producto.component';

describe('VerDetallesProductoComponent', () => {
  let component: VerDetallesProductoComponent;
  let fixture: ComponentFixture<VerDetallesProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerDetallesProductoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VerDetallesProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
