import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerarAnalisisReportesComponent } from './generar-analisis-reportes.component';

describe('GenerarAnalisisReportesComponent', () => {
  let component: GenerarAnalisisReportesComponent;
  let fixture: ComponentFixture<GenerarAnalisisReportesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerarAnalisisReportesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GenerarAnalisisReportesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
