'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// get the current workbench configuration
var wbconfig = vscode.workspace.getConfiguration('workbench')
// get the user config for nightswitch
var nsconfig = vscode.workspace.getConfiguration('nightswitch')

const TESTStartingCurrTime = (new Date()).getTime()
const TESTStartingTime =	1493776153933

export function activate(context: vscode.ExtensionContext) {

	// // get the current workbench configuration
	// var wbconfig = vscode.workspace.getConfiguration('workbench');
	// // get the user config for nightswitch
	// var nsconfig = vscode.workspace.getConfiguration('nightswitch');
	var toggle = makeToggle();

	//var time = new Date()
	var time = new Date()
	var SunCalc = require('suncalc')

	if (nsconfig.get('geolocation')) {
		//Nothing for now...
	}
	else if (nsconfig.get('location') != null) {
		console.log('NS: running location');
		const coords = parseCoordinates(nsconfig.get<string>('location'))
		console.log('(' + coords[0] + ',' + coords[1] + ')');
		locationSwitch(coords, time, SunCalc)
	}
	console.info('NS: NightSwitch is now active!');
}


function makeToggle() {
	return vscode.commands.registerCommand('extension.toggleTheme', () => {

		var currentTheme = wbconfig.get<string>('colorTheme'),
			dayTheme = nsconfig.get<string>('dayTheme'),
			nightTheme = nsconfig.get<string>('nightTheme');

		if (currentTheme === dayTheme) {
			setThemeNight()
		}
		else if (currentTheme === dayTheme) {
			setThemeDay()
		}
		else {
			vscode.window.showInformationMessage('Your current theme is not set to either your day or night theme. Please update your settings.');
		}
	});
}


function parseCoordinates(coords: string): number[] {
	const splcoords = coords.split(/\(|,|\)/);
	return new Array(Number(splcoords[1]), Number(splcoords[2]))
}


async function locationSwitch(coords: Number[], time: Date, SunCalc: any) {
	var stimes = SunCalc.getTimes(time, coords[0], coords[1]);

	//Test
	const currtime = time.getTime(),
		srise = stimes.sunrise.getTime(),
		sset = stimes.sunset.getTime();

	console.log('NS: current time: ' + currtime)
	console.log('NS: sunrise: ' + srise)
	console.log('NS: sunset: ' + sset)

	const timeToSunrise 	= srise - currtime,
			timeToSunset 	= sset - currtime;

	console.log('NS: timeToSunrise: ' + timeToSunrise)
	console.log('NS: timeToSunset: ' + timeToSunset)

	if (timeToSunrise > 0) {
		// obviously give priority to sunrise
		console.log('NS: waiting until sunrise...')
		await sleep(timeToSunrise)
		setThemeDay()
		console.log('NS: set theme to day')
	}
	else if (timeToSunset > 0) {
		console.log('waiting until sunset...')
		await sleep(timeToSunset)
		setThemeNight()
		console.log('NS: set theme to night')
	}
	else {
		// this means it's after sunset, but before midnight
		console.log('NS: waiting until sunrise tomorrow...')
		// set a virtual time 12hrs from now to get sunrise tomorrow
		const virtualtime = currtime + 12*60*60*1000;
		var stimes = SunCalc.getTimes(new Date(virtualtime), coords[0], coords[1]);
		const srise = stimes.sunrise.getTime()

		console.log('NS: sunrise tomorrow: ' + srise)
		const timeToSunriseTmrw = srise - currtime
		console.log('NS: timeToSunriseTmrw: ' + timeToSunriseTmrw)
		await sleep(timeToSunriseTmrw)
		setThemeDay()
	}new Date()
	locationSwitch(coords, new Date(), SunCalc)
}


function setThemeNight() {
	wbconfig.update('colorTheme', nsconfig.get<string>('nightTheme'), true);
}


function setThemeDay() {
	wbconfig.update('colorTheme', nsconfig.get<string>('dayTheme'), true);
}


function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}


// this method is called when your extension is deactivated
export function deactivate() {
}