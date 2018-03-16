'use strict';
import {workspace, window, commands, ExtensionContext} from 'vscode';

const SunCalc = require('suncalc');
const geoip = require('geoip-lite');

var wbconfig = workspace.getConfiguration('workbench');
var nsconfig = workspace.getConfiguration('nightswitch');
var autoSwitch, time, hasShownEnableMsgOnce;

export function activate(context: ExtensionContext)
{

	autoSwitch = nsconfig.get<boolean>('autoSwitch')
	context.subscriptions.push(makeToggle());
	context.subscriptions.push(makeSwitchDay());
	context.subscriptions.push(makeSwitchNight());
	context.subscriptions.push(enableAutoSwitch());
	context.subscriptions.push(window.onDidChangeWindowState(recheck));
	context.subscriptions.push(window.onDidChangeActiveTextEditor(recheck));
	context.subscriptions.push(window.onDidChangeTextEditorViewColumn(recheck));

	var srisemanual = -1
	var ssetmanual = -1
	var srisetmrwmanual = -1
	var ssettmrwmanual = -1

	const manualTimes = [srisemanual, ssetmanual, srisetmrwmanual, ssettmrwmanual]

	recheck();
	console.info('NightSwitch is now active!');
}


function parseManualTime(date: string, time: Date): number
{
	const hm = date.split(':')
	const fullTime = time.getTime()
	const currentHours = time.getHours() * 60 * 60 * 1000
	const currentMinutes = time.getMinutes() * 60 * 1000
	const currentSeconds = time.getSeconds() * 1000
	const currentMilliseconds = time.getMilliseconds()

	const todayStart = fullTime - currentHours - currentMinutes - currentSeconds - currentMilliseconds

	const parsedTime = todayStart + (Number(hm[0]) * 60 * 60 * 1000) + (Number(hm[1]) * 60 * 1000)

	return parsedTime
}


function useGeo(manualTimes: number[])
{
	const publicIp = require('public-ip');
	publicIp.v4().then(ip => {
			// console.log('NS: public-ip: ' + ip)
			const geoCoords = geoip.lookup(ip).ll;
			// console.log('NS: geoCoords: (' + geoCoords[0] + ',' + geoCoords[1] + ')');
			locationSwitch(geoCoords, manualTimes)
		});
}


function locationSwitch(coords: Number[], manualTimes: number[]) 
{

	// if autoSwitch is turned off then return immediately
	if(!autoSwitch)
	{
		return;
	}

	// if coords are set then get the sun times
	if(coords != null)
	{
		var stimes = SunCalc.getTimes(time, coords[0], coords[1]);
	}

	// get the current time
	const currtime = time.getTime()

	let srise = manualTimes[0],
		sset = manualTimes[1],
		srisetmrw = manualTimes[2],
		ssettmrw = manualTimes[3];

	// if manual sunrise is not set and the coordinates are set then get the time of sunrise
	if(srise === -1 && coords != null)
	{
		srise = stimes.sunrise.getTime()
	}

	// get the time of sunset
	if(sset === -1 && coords != null)
	{
		sset = stimes.sunset.getTime();
	}

	timeSwitch(currtime, srise, sset)

}


function timeSwitch(currtime: number, srise: number, sset: number)
{
	const timeToSunrise = srise - currtime,
		timeToSunset = sset - currtime;

	if(timeToSunrise > 0)
	{
		// obviously give priority to sunrise
		setThemeNight()
	}
	else if(timeToSunset > 0)
	{
		setThemeDay()
	}
	else
	{
		// this means it's after sunset but before midnight
		// if we are using manual time but dont specify one of them without location, then we don't assume anything

		if(!(srise == -1 || sset == -1))
		{
			setThemeNight()
		}
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
	const splcoords = coords.replace(/\(|\)/g, '').split(/,/);
	return new Array(Number(splcoords[0]), Number(splcoords[1]))
}


function setThemeNight()
{
	wbconfig.update('colorTheme', nsconfig.get<string>('nightTheme'), true);
}


function setThemeDay()
{
	wbconfig.update('colorTheme', nsconfig.get<string>('dayTheme'), true);
}

function showAutoSwitchMsg()
{
	window.showInformationMessage('Automatic switching has been disabled. To reenable, use the command "Enable Automatic Theme Switching".', 'Click here to reenable').then(fulfilled => {autoSwitch = true; recheck();});
	hasShownEnableMsgOnce = true;
}


function recheck()
{
	reloadConfig()
	
	const srisestr = nsconfig.get<string>('sunrise')
	const ssetstr = nsconfig.get<string>('sunset')

	time = new Date()

	let srisemanual = -1,
		ssetmanual = -1,
		srisetmrwmanual = -1,
		ssettmrwmanual = -1;

	if(srisestr != null)
	{
		srisemanual = parseManualTime(srisestr, time)
		srisetmrwmanual = srisemanual + 24 * 60 * 60 * 1000
	}

	if(ssetstr != null)
	{
		ssetmanual = parseManualTime(ssetstr, time)
		ssettmrwmanual = ssetmanual + 24 * 60 * 60 * 1000
	}

	const manualTimes = [srisemanual, ssetmanual, srisetmrwmanual, ssettmrwmanual]

	if(nsconfig.get('location') != null)
	{
		// console.log('NS: running location');
		const coords = parseCoordinates(nsconfig.get<string>('location'))
		if(Number.isNaN(coords[0]) || Number.isNaN(coords[1]))
		{
			window.showWarningMessage('Something went wrong with your coordinates. Try using the format \"(xxx.xxxx,yyy.yyyy)\".')
		}
		else
		{
			// console.log('NS: (' + coords[0] + ',' + coords[1] + ')');
			locationSwitch(coords, manualTimes)
		}
	}
	else if(nsconfig.get('geolocation'))
	{
		useGeo(manualTimes)
	}
	else if(nsconfig.get('sunrise') != null || nsconfig.get('sunset') != null)
	{
		// console.log('NSL: running manual sunrise or sunset')

		//set coords to unreachable value
		locationSwitch(null, manualTimes)
	}
}


function reloadConfig()
{
	// get the current workbench configuration
	wbconfig = workspace.getConfiguration('workbench');
	// get the user config for nightswitch
	nsconfig = workspace.getConfiguration('nightswitch');
}