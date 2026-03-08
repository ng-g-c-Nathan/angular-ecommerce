import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutorizarFacturasComponent } from './autorizar-facturas.component';

describe('AutorizarFacturasComponent', () => {
  let component: AutorizarFacturasComponent;
  let fixture: ComponentFixture<AutorizarFacturasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutorizarFacturasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AutorizarFacturasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
