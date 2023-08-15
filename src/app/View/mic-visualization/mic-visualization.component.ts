import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { DirectorService } from 'src/app/Presenter/director.service';
import { BBusResult } from 'src/app/Model/Emulator/b-bus.service';
import { CBusResult } from 'src/app/Model/Emulator/c-bus.service';
import { ABusComponent } from '../SVG/a-bus/a-bus.component';
import { BBusComponent } from '../SVG/b-bus/b-bus.component';
import { CBusComponent } from '../SVG/c-bus/c-bus.component';
import { ShifterComponent } from '../SVG/shifter/shifter.component';

@Component({
  selector: 'app-mic-visualization',
  templateUrl: './mic-visualization.component.svg',
  styleUrls: ['./mic-visualization.component.scss']
})
export class MicVisualizationComponent implements AfterViewInit {
  @ViewChild("bBus") bBus: BBusComponent;
  @ViewChild("cBus") cBus: CBusComponent;
  @ViewChild("aBus") aBus: ABusComponent;
  @ViewChild("shifter") shifter: ShifterComponent;

  animationSpeed = 2;

  constructor(
    private director: DirectorService,
  ) { }

  endAnimation(event: string) {
    console.log(event)
  }

  ngAfterViewInit(): void {

    this.director.setRegisterValues.subscribe(
      results => {
        if (results[0]) {
          const register:string = results[0];
          const value: number = results[1];
          const activateArrow: boolean = results[2];
          this.cBus.setRegisterValues(register, value, activateArrow);
        }
      }
    )

    this.director.startAnimation.subscribe(
      results => {
        if (results[0]) {
          const bBusResult: BBusResult = results[0];
          const aluResult: number = results[1];
          const shifterResult: number = results[2];
          const cBusResult: CBusResult = results[3];
          const aBusResult: number = results[4];

          this.animationSpeed = this.director.animationSpeed;

          // start first animation -> wait until finished -> start next -> ...
          const bBusAnimation = this.bBus.startAnimation(bBusResult.register, bBusResult.value);
          this.aBus.startAnimation(aBusResult);
          bBusAnimation.then(() => {
            const shifterAnimation = this.shifter.startAnimation(aluResult);
            shifterAnimation.then(() => {
              const cBusAnim = this.cBus.startAnimation(cBusResult.registers, cBusResult.value);
              cBusAnim.then(()=> this.director.animationComplete = true);
            })
          })
        }

      }
    )

  }

}
