'use strict';
import {workspace, window, commands, ExtensionContext} from 'vscode';

const SunCalc  = require('suncalc');
const geoip    = require('geoip-lite');
const publicIp = require('public-ip');

var wbconfig = workspace.getConfiguration('workbench');
var nsconfig = workspace.getConfiguration('nightswitch');
var autoSwitch, hasShownEnableMsgOnce, hasShownFixSettingsOnce;

export function activate(context: ExtensionContext)
{
	hasShownEnableMsgOnce = false;
	hasShownFixSettingsOnce = false;

	autoSwitch = nsconfig.get<boolean>('autoSwitch');

	recheck();

	context.subscriptions.push(makeToggle());
	context.subscriptions.push(makeSwitchDay());
	context.subscriptions.push(makeSwitchNight());
	context.subscriptions.push(enableAutoSwitch());
	context.subscriptions.push(window.onDidChangeWindowState(recheck));
	context.subscriptions.push(window.onDidChangeActiveTextEditor(recheck));
	context.subscriptions.push(window.onDidChangeTextEditorViewColumn(recheck));

	// recheck every 5 minutes
	setInterval(recheck, 1000*60*5);
	console.info('NightSwitch-Lite is now active!');
}


function parseManualTime(time: string, date: Date): number
{
	const hm = time.split(':');
	const fullTime = date.getTime();
	const currentHours = date.getHours() * 60 * 60 * 1000;
	const currentMinutes = date.getMinutes() * 60 * 1000;
	const currentSeconds = date.getSeconds() * 1000;
	const currentMilliseconds = date.getMilliseconds();

	const todayStart = fullTime - currentHours - currentMinutes - currentSeconds - currentMilliseconds

	const parsedTime = todayStart + (Number(hm[0]) * 60 * 60 * 1000) + (Number(hm[1]) * 60 * 1000)

	return parsedTime
}


function timeSwitch(currtime: number, srise: number, sset: number)
{
	const timeToSunrise = srise - currtime,
		 timeToSunset  = sset  - currtime;

	if(timeToSunrise > 0)
	{
		setThemeNight()
	}
	else if(timeToSunset > 0)
	{
		setThemeDay()
	}
	else
	{
		// this means it's after sunset but before midnight
		setThemeNight()
	}
}


function makeToggle()
{
	return commands.registerCommand('extension.toggleTheme', () =>
	{
		reloadConfig()
		var currentTheme = wbconfig.get<string>('colorTheme')

		if(currentTheme === nsconfig.get<string>('dayTheme'))
		{
			setThemeNight()
			autoSwitch = false;
		}
		else if(currentTheme === nsconfig.get<string>('nightTheme'))
		{
			setThemeDay()
			autoSwitch = false;
		}
		else
		{
			window.showInformationMessage('Your current theme is not set to either your day or night theme. Please update your settings.');
		}

		if(!autoSwitch && !hasShownEnableMsgOnce)
		{
			showAutoSwitchMsg();
		}

	});
}


function makeSwitchDay()
{
	return commands.registerCommand('extension.switchDay', () =>
	{
		setThemeDay()
		autoSwitch = false;

		if(!hasShownEnableMsgOnce)
		{
			showAutoSwitchMsg();
		}

	});
}


function makeSwitchNight()
{
	return commands.registerCommand('extension.switchNight', () =>
	{
		setThemeNight()
		autoSwitch = false;

		if(!hasShownEnableMsgOnce)
		{
			showAutoSwitchMsg();
		}

	});
}

function enableAutoSwitch()
{
	return commands.registerCommand('extension.enableAutoSwitch', () =>
	{
		autoSwitch = true;
		recheck();
	});
}


function parseCoordinates(coords: string): number[]
{
	if(coords != null)
	{
		const splcoords = coords.replace(/\(|\)/g, '').split(/,/);
		return new Array(Number(splcoords[0]), Number(splcoords[1]))
	}
	else
	{
		return null;
	}
}


function setThemeNight()
{
	wbconfig.update('colorTheme', nsconfig.get<string>('nightTheme'), true)
}


function setThemeDay()
{
	wbconfig.update('colorTheme', nsconfig.get<string>('dayTheme'), true)
}

function showAutoSwitchMsg()
{
	window.showInformationMessage('Automatic switching has been disabled. To reenable, use the command "Enable Automatic Theme Switching".', 
	'Click here to reenable').then(fulfilled => {autoSwitch = true; recheck();});
	hasShownEnableMsgOnce = true;
}

function recheck()
{

	if(!autoSwitch)
	{
		return;
	}
	
	reloadConfig();

	let srisetime, ssettime;

	const currdate = new Date();
	let coords = parseCoordinates(nsconfig.get<string>('location'));
	let srisestr = nsconfig.get<string>('sunrise');
	let ssetstr = nsconfig.get<string>('sunset');


	if(coords != null && (Number.isNaN(coords[0]) || Number.isNaN(coords[1])))
	{
		window.showWarningMessage("Please set your coordinates in decimal degrees so that NightSwitch-lite can parse them (example: \"(49.89,-97.14)\").");
		return;
	}

	if(coords == null && nsconfig.get("geolocation"))
	{
		publicIp.v4().then(ip => {
			// console.log('NS: public-ip: ' + ip)
			coords = geoip.lookup(ip).ll;
		});
	}

	if(coords != null)
	{

		const tmp_hours = currdate.getHours();
		currdate.setHours(12);

		const calculatedTimes = SunCalc.getTimes(currdate, coords[0], coords[1]);

		currdate.setHours(tmp_hours);

		srisetime = calculatedTimes.sunrise.getTime();
		ssettime = calculatedTimes.sunset.getTime();

	}

	// takes precedence over location-based
	if(srisestr != null)
	{
		srisetime = parseManualTime(srisestr, currdate);
		if(Number.isNaN(srisetime))
		{
			window.showWarningMessage("Something went wrong with your manually set sunrise time. Please use 24-hour format (HH:MM).");
			return;
		}
	}

	if(ssetstr != null)
	{
		ssettime = parseManualTime(ssetstr, currdate);
		if(Number.isNaN(ssettime))
		{
			window.showWarningMessage("Something went wrong with your manually set sunset time. Please use 24-hour format (HH:MM).");
			return;
		}
	}

	if((typeof srisetime == "undefined") || typeof ssettime == "undefined")
	{
		window.showInformationMessage("Please edit your settings to specify how NightSwitch will locate you.", 
		"Go to settings").then(fulfilled => {commands.executeCommand("workbench.action.openSettings")});
		hasShownFixSettingsOnce = true;
		return;
	}

	
	timeSwitch(currdate.getTime(), srisetime, ssettime);

}

function reloadConfig()
{
	// get the current workbench configuration
	wbconfig = workspace.getConfiguration('workbench');
	// get the user config for nightswitch
	nsconfig = workspace.getConfiguration('nightswitch');
}
