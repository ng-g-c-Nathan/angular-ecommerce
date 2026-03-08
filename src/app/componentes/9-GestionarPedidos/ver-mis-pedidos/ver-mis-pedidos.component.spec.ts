import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerMisPedidosComponent } from './ver-mis-pedidos.component';

describe('VerMisPedidosComponent', () => {
  let component: VerMisPedidosComponent;
  let fixture: ComponentFixture<VerMisPedidosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerMisPedidosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VerMisPedidosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
