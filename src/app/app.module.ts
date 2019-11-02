import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { FeatureComponent } from "./feature/feature.component";
import { BugComponent } from "./bug/bug.component";
import { HomeComponent } from "./home/home.component";
import { FormsModule } from "@angular/forms";

@NgModule({
	declarations: [ AppComponent, FeatureComponent, BugComponent, HomeComponent ],
	imports: [ BrowserModule, AppRoutingModule, FormsModule, HttpClientModule ],
	providers: [],
	bootstrap: [ AppComponent ]
})
export class AppModule {}
