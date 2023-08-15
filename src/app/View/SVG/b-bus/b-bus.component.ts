import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { BBusResult } from 'src/app/Model/Emulator/b-bus.service';
import { SvgUtilitiesService } from '../svg-utilities.service';
declare let anime: any;


@Component({
  selector: '[app-b-bus]',
  templateUrl: './b-bus.component.html',
  styleUrls: ['./b-bus.component.scss']
})
export class BBusComponent implements AfterViewInit {
  @Input() speed: number = 2;
  @Output() endEvent = new EventEmitter<string>()


  constructor(private svgUtilities: SvgUtilitiesService) { }

  ngAfterViewInit(): void {
  }

  public visible = false;
  public path: string = "M 289  87 365  87 365 723"
  public value: number; // display the value inside the circle

  public timeline: any;

  public duration = 1;

  public paths: { [key: string]: string } = {
    "MDR": "M   289  52   365  52   365 573",
    "PC":  "M   289 127   365 127   365 573",
    "MBR": "M   289 184   365 184   365 573",
    "MBRU":"M   289 195   365 195   365 573",
    "SP":  "M   289 241   365 241   365 573",
    "LV":  "M   289 296   365 296   365 573",
    "CPP": "M   289 353   365 353   365 573",
    "TOS": "M   289 408   365 408   365 573",
    "OPC": "M   289 464   365 464   365 573",
  }

  async startAnimation(reg: string, value: number) {
    this.path = this.paths[reg];
    this.value = value;
    let duration = this.svgUtilities.calcDuration(this.path, this.speed);


    // wait until path is updated in DOM
    let delay = function (ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms))
    }
    await delay(1);

    const path = anime.path(".bAnimationPath")

    // if there is an other timeline -> stop it
    this.timeline ? this.timeline.pause() : {};

    this.timeline = anime.timeline({
      easing: 'easeOutExpo',
      duration: 750,
      loop: 1,
    });

    this.timeline.add({
      targets: ".bBusContent",
      translateX: path("x"),
      translateY: path('y'),
      easing: 'easeInOutSine',
      duration: duration * 1000,
      begin: () => { this.visible = true },
      complete: () => { this.visible = false },
    })

    return this.timeline.finished;

  }
}
