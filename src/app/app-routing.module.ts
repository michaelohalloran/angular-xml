import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { HomeComponent } from "./home/home.component";
import { BugComponent } from "./bug/bug.component";
import { FeatureComponent } from "./feature/feature.component";

const routes: Routes = [
	{ path: "", component: HomeComponent },
	{ path: "feature", component: FeatureComponent },
	{ path: "bug", component: BugComponent }
];

@NgModule({
	imports: [ RouterModule.forRoot(routes) ],
	exports: [ RouterModule ]
})
export class AppRoutingModule {}
