import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { VideoControllerService } from 'src/app/Model/GraphicsAdapter/video-controller.service';

@Component({
  selector: 'app-screen',
  templateUrl: './screen.component.html',
  styleUrls: ['./screen.component.css']
})
export class ScreenComponent implements AfterViewInit {
  @ViewChild('canvas') private canvas: ElementRef = {} as ElementRef<HTMLCanvasElement>;
  private ctx: CanvasRenderingContext2D

  private readonly WIDTH = 320;
  private readonly HEIGHT = 200;

  constructor(private videoController: VideoControllerService) { }

  ngAfterViewInit(): void {
    this.ctx = this.canvas.nativeElement.getContext("2d");

    this.wipeScreen();

    this.videoController.wipeScreen$.subscribe(val => {
      this.wipeScreen();
    })

    this.videoController.sendPixel$.subscribe(val => {
      this.setPixel(val.x, val.y, val.color)
    })

    this.videoController.sendBitmap$.subscribe(val => {
      this.setBitmap(val.x, val.y, val.bitmap);
    })
  }

  private setPixel(x: number, y: number, color: string): void {

    this.ctx.fillStyle = color;

    // calc how big a pixel is
    let PixelWidth = this.canvas.nativeElement.width / this.WIDTH;
    let PixelHeight = this.canvas.nativeElement.height / this.HEIGHT;

    x = PixelWidth * x;
    y = PixelHeight * y;

    this.ctx.fillRect(x, y, PixelWidth, PixelHeight);
  }

  private setBitmap(x: number, y: number, bitmap: Uint8ClampedArray) {
    this.ctx.putImageData(new ImageData(bitmap, 8, 8), x, y);
  }




  private wipeScreen() {
    this.ctx.fillStyle = "rgb(0,0,0)";
    this.ctx.fillRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);

  }
}


