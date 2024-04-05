import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { GridViewComponent } from './View/grid-view/grid-view.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ToolBarComponent } from './View/tool-bar/tool-bar.component';
import { MatButtonModule} from '@angular/material/button';
import { ToolBarMicViewComponent } from './View/tool-bar-mic-view/tool-bar-mic-view.component';
import { EditorComponent } from './View/editor/editor.component';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { StackComponent } from './View/stack/stack.component';
import { MicroEditorComponent } from './View/micro-editor/micro-editor.component';
import { MicVisualizationComponent } from './View/mic-visualization/mic-visualization.component';
import { BBusComponent } from './View/SVG/b-bus/b-bus.component';
import { CBusComponent } from './View/SVG/c-bus/c-bus.component';
import { ABusComponent } from './View/SVG/a-bus/a-bus.component';
import { ShifterComponent } from './View/SVG/shifter/shifter.component';
import { RegistersComponent } from './View/SVG/registers/registers.component';
import { MatDialogModule } from '@angular/material/dialog';
import { GettingStartedDialogComponent } from './View/tool-bar/getting-started-dialog/getting-started-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { AboutDialogComponent } from './View/tool-bar/about-dialog/about-dialog.component';
import { MatSelectModule } from '@angular/material/select';
import { MdbDropdownModule } from 'mdb-angular-ui-kit/dropdown';
import {MatTabsModule} from '@angular/material/tabs';
import { DebugConsoleComponent } from './View/debug-console/debug-console.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AluFlagArrowsComponent } from './View/SVG/alu-flag-arrows/alu-flag-arrows.component';
import { MemoryViewComponent } from './View/memory-view/memory-view.component';
import {MatTreeModule} from '@angular/material/tree';
import {MatMenuModule} from '@angular/material/menu';
import { ImportDialogComponent } from './View/tool-bar/import-dialog/import-dialog.component';
import { ExportDialogComponent } from './View/tool-bar/export-dialog/export-dialog.component';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { MatInputModule } from '@angular/material/input';
import { TutorModeComponent } from './View/tutor-mode/tutor-mode.component';
import { CommentViewComponent } from './View/comment-view/comment-view.component';
import {MatTooltipModule} from '@angular/material/tooltip';
import { ScreenComponent } from './View/screen/screen.component';
import { BatchSettingsDialogComponent } from './View/tutor-mode/batch-settings-dialog/batch-settings-dialog.component';
import { MatRadioModule } from '@angular/material/radio';




@NgModule({
  declarations: [
    AppComponent,
    GridViewComponent,
    ToolBarComponent,
    ToolBarMicViewComponent,
    EditorComponent,
    StackComponent,
    MicroEditorComponent,
    MicVisualizationComponent,
    BBusComponent,
    CBusComponent,
    ABusComponent,
    ShifterComponent,
    RegistersComponent,
    GettingStartedDialogComponent,
    AboutDialogComponent,
    DebugConsoleComponent,
    AluFlagArrowsComponent,
    MemoryViewComponent,
    ImportDialogComponent,
    ExportDialogComponent,
    TutorModeComponent,
    CommentViewComponent,
    ScreenComponent,
    BatchSettingsDialogComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatGridListModule,
    MatToolbarModule,
    MatButtonModule,
    TextFieldModule,
    MatFormFieldModule,
    FormsModule,
    HttpClientModule,
    MatCheckboxModule,
    MatCardModule,
    MatSliderModule, 
    MatDialogModule,
    MatIconModule,
    MatSelectModule,
    MdbDropdownModule,
    MatTabsModule,
    MatSlideToggleModule,
    MatTreeModule,
    MatMenuModule,
    NgxDropzoneModule,
    MatInputModule,
    ReactiveFormsModule,
    MatTooltipModule,
    MatRadioModule, 
  ],

  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
