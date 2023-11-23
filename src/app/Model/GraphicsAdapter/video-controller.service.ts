import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MainMemoryService } from '../Emulator/main-memory.service';
import { CharacterROMService } from './character-rom.service';

const VRAM_ADDRESS = 1073677824;  // 0x3fff0600 * 4 = 0xFFFC1800
const VRAM_SIZE = 64000;

const SCREEN_HEIGHT = 200;
const SCREEN_WIDTH = 320;

const CHANGE_MODE_ADDRESS = 1073677823;  // 0x3fff05ff * 4 = 0xFFFC17FC

const COLUMNS = SCREEN_WIDTH / 8;
const ROWS = SCREEN_HEIGHT / 8;



// all 16 VGA TextMode Colors in the right order
const COLORS = [
  "#000000",      // 0 - Black
  "#0000ff",      // 1 - Blue
  "#008000",      // 2 - Green
  "#00ffff",      // 3 - Cyan
  "#ff0000",      // 4 - red
  "#ff00ff",      // 5 - magenta
  "#a52a2a",      // 6 - brown
  "#d3d3d3",      // 7 - lightGray
  "#a9a9a9",      // 8 - darkGray
  "#add8e6",      // 9 - lightBlue
  "#90ee90",      // A - lightGreen
  "#80ffff",      // B - lightCyan
  "#ffcccb",      // C - lightRed
  "#ffc0cb",      // D - pink
  "#ffff00",      // E - yellow
  "#ffffff",      // F - white
]


@Injectable({
  providedIn: 'root'
})
export class VideoControllerService {

  private _sendPixel = new BehaviorSubject({ x: 0, y: 0, color: "rgb(0,0,0)" });
  public sendPixel$ = this._sendPixel.asObservable();

  private _sendBitmap = new BehaviorSubject({ x: 0, y: 0, bitmap: new Uint8ClampedArray(256).map((n, index) => index % 4 == 3 ? n = 255 : n = 0) });
  public sendBitmap$ = this._sendBitmap.asObservable();

  private _wipeScreen = new BehaviorSubject(true);
  public wipeScreen$ = this._wipeScreen.asObservable();

  public textMode = true;


  constructor(
    private mainMemory: MainMemoryService,
    private characterROM: CharacterROMService,
  ) {
    this.mainMemory.updateMemory$.subscribe(entry => {
      //filter all relevant changes

      // detect changes in VRAM
      if (entry.address >= VRAM_ADDRESS * 4 && entry.address <= (VRAM_ADDRESS + VRAM_SIZE) * 4) {
        this.textMode ? this.characterMode(entry.address, entry.value) : this.graphicsMode(entry.address, entry.value);
        
      }

      // detect Mode Change
      if (entry.address === CHANGE_MODE_ADDRESS * 4) {
        this.textMode = !entry.value;
        console.log(this.textMode ? "enabled TextMode" : "enabled graphicsMode");
      }


    })
  }


  private graphicsMode(address: number, value: number) {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer, 0);

    view.setInt32(0, value);
    let r = view.getUint8(1);
    let g = view.getUint8(2);
    let b = view.getUint8(3);

    // calc the nth pixel
    let n = address / 4 - VRAM_ADDRESS
    let x = n % SCREEN_WIDTH
    let y = Math.floor(n / SCREEN_WIDTH);
    console.log(n)
    console.log(x, y)

    this._sendPixel.next({ x: x, y: y, color: `rgb(${r},${g},${b})` })
  }

  private characterMode(address: number, value: number) {
    /**
     * at the address is a 32 Bit Word
     * we don't know which one of the 16 Bit values changed
     * -> draw both characters
    */
    let n = (address / 4 - VRAM_ADDRESS) * 2;
    let x = Math.floor(n % COLUMNS) * 8;
    let y = Math.floor(n / COLUMNS) * 8;

    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer, 0);

    view.setInt32(0, value);
    let first = { character: view.getUint8(0), attribute: view.getUint8(1) };
    let second = { character: view.getUint8(2), attribute: view.getUint8(3) };

    let bitField = new Uint8ClampedArray(256);
    try {
      bitField = this.characterROM.getCharacterBitmap(first.character).bitmap;
    } catch (error) {
      console.warn("character", first.character, "is not in Character ROM returning 0")
    }

    /**
    Bit 76543210
        ||||||||
        |||||^^^-fore color
        ||||^----fore color bright bit
        |^^^-----back color
        ^--------back color bright bit OR enables blinking Text
    */
    let color = COLORS[first.attribute & 0b00001111];
    let backgroundColor = COLORS[(first.attribute & 0b01110000) >> 4];

    // change bitmap colors if Char is not white on black
    if (color !== "#ffffff" || backgroundColor !== "#000000") {
      bitField = this.changeBitmapColor(color, backgroundColor, this.characterROM.getCharacterBitmap(first.character).bitmap);
    }


    this._sendBitmap.next({ x: x, y: y, bitmap: bitField });

    // set second Character
    try {
      bitField = this.characterROM.getCharacterBitmap(second.character).bitmap;
    } catch (error) {
      console.log("character", second.character, "is not in Character ROM returning 0")
    }

    // set color for second Character
    color = COLORS[second.attribute & 0b00001111];
    backgroundColor = COLORS[(second.attribute & 0b01110000) >> 4];


    // change bitmap colors if Char is not white on black
    if (color !== "#ffffff" || backgroundColor !== "#000000") {
      bitField = this.changeBitmapColor(color, backgroundColor, this.characterROM.getCharacterBitmap(first.character).bitmap);
    }

    this._sendBitmap.next({ x: x + 8, y: y, bitmap: bitField });

  }

  private changeBitmapColor(color: string, backgroundColor: string, data: Uint8ClampedArray) {

    let array = new Uint8ClampedArray(data.length);
    for (let i = 0; i < array.length; i++) {
      array[i] = data[i]
    }

    for (let i = 0; i < data.length; i += 4) {
      if (data[i]) {
        data[i + 0] = parseInt(color.slice(1, 3), 16);
        data[i + 1] = parseInt(color.slice(3, 5), 16);
        data[i + 2] = parseInt(color.slice(5, 7), 16);
      } else {
        data[i + 0] = parseInt(backgroundColor.slice(1, 3), 16);
        data[i + 1] = parseInt(backgroundColor.slice(3, 5), 16);
        data[i + 2] = parseInt(backgroundColor.slice(5, 7), 16);
      }
    }

    return new Uint8ClampedArray(data);
  }



  public wipeScreen() {
    this._wipeScreen.next(true);
  }

}
