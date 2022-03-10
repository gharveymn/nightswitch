'use strict';
import {workspace, window, commands, ExtensionContext, ConfigurationTarget} from 'vscode';

const SunCalc = require('suncalc');
const Coordinates = require("coordinate-parser");
const GeoIp    = require('geoip-lite');
const PublicIp = require('public-ip');
const WiFiScanner = require('node-wifiscanner');

var wb_config = workspace.getConfiguration('workbench');
var ns_config = workspace.getConfiguration('nightswitch');
var autoswitch_enabled;
var has_shown_autoswitch_disabled_msg;
var has_shown_fix_settings_once;

export function activate(context: ExtensionContext)
{
	autoswitch_enabled = ns_config.get('autoSwitch');
	has_shown_autoswitch_disabled_msg = ns_config.get('disableAutoSwitchNotifications');
	has_shown_fix_settings_once = false;

	createCmdSetup();
	createCmdToggleTheme();
	createCmdSwitchThemeDay();
	createCmdSwitchThemeNight();
	createCmdAutoSwitch();
	createCmdSetConfigLocation();
	createCmdSetConfigThemeDay();
	createCmdSetConfigThemeNight();
	createCmdSetConfigSunrise();
	createCmdSetConfigSunset();

	window.onDidChangeWindowState(recheck);
	window.onDidChangeActiveTextEditor(recheck);
	window.onDidChangeTextEditorViewColumn(recheck);
	workspace.onDidSaveTextDocument(function(d) {
		if(d.fileName.split('\\').pop().split('\/').pop() === 'settings.json')
		{
			reloadNightSwitchConfig();
			recheck();
		}
	});

	// recheck every 5 minutes
	setInterval(recheck, 1000 * 60 * 5);
	recheck();

}


function parseManualTime(time: string): number
{
	const regex = /^(\d{1,2})(?:\:|\s*)(\d{2}|)\s*((?:AM|PM)|)$/;
	const matches = regex.exec(time);
	if(!matches || !matches[1])
	{
		// must be non-empty and must have hour
		return null;
	}

	const today_start = new Date().setHours(0, 0, 0, 0);

	let h = Number(matches[1]);

	if(h < 0 || h >= 24)
	{
		return null;
	}

	if(matches[3].length != 0)
	{
		
		if(h > 12)
		{
			return null;
		}

		h %= 12;
		if(matches[3] === "PM")
		{
			h += 12;
		}
		// else if AM do nothing
	}

	let m = 0;

	if(matches[2].length != 0)
	{
		m = Number(matches[2]);
		if(m < 0 || m >= 60)
		{
			return null;
		}
	}

	let h_mil = h * 60 * 60 * 1000;
	let m_mil = m * 60 * 1000;

	return today_start + h_mil + m_mil;
}


function timeSwitch(currtime: number, srise: number, sset: number)
{
	const time_to_srise = srise - currtime,
		 time_to_sset  = sset  - currtime;

	if(time_to_srise > 0)
	{
		setThemeNight()
	}
	else if(time_to_sset > 0)
	{
		setThemeDay()
	}
	else
	{
		// this means it's after sunset but before midnight
		setThemeNight()
	}
}


function createCmdToggleTheme()
{
	return commands.registerCommand('extension.toggleTheme', () =>
	{
		reloadWorkbenchConfig();
		reloadNightSwitchConfig();
		var curr_theme = wb_config.get('colorTheme')
		if(curr_theme === ns_config.get('themeDay'))
		{
			disableAutoSwitch();
			setThemeNight();
		}
		else if(curr_theme === ns_config.get('themeNight'))
		{
			disableAutoSwitch();
			setThemeDay();
		}
		else
		{
			window.showInformationMessage('Your current theme is set to neither your day nor your night theme. Please update your settings.');
		}
	});
}

function createCmdSwitchThemeDay()
{
	return commands.registerCommand('extension.switchThemeDay', () => switchThemeDay());
}

function createCmdSwitchThemeNight()
{
	return commands.registerCommand('extension.switchThemeNight', () => switchThemeNight());
}

function createCmdAutoSwitch()
{
	return commands.registerCommand('extension.toggleAutoSwitch', () => toggleAutoSwitchEnabled());
}

function createCmdSetup()
{
	return commands.registerCommand('extension.setup', () => setup());
}

function createCmdSetConfigLocation()
{
	return commands.registerCommand('extension.setLocation', () => setConfigLocation());
}

function createCmdSetConfigThemeDay()
{
	return commands.registerCommand('extension.setThemeDay', () => setConfigThemeDay());
}

function createCmdSetConfigThemeNight()
{
	return commands.registerCommand('extension.setThemeNight', () => setConfigThemeNight());
}

function createCmdSetConfigSunrise()
{
	return commands.registerCommand('extension.setSunrise', () => setConfigSunrise());
}

function createCmdSetConfigSunset()
{
	return commands.registerCommand('extension.setSunset', () => setConfigSunset());
}

async function setConfigLocation()
{
	let loc_str = await window.showInputBox({
			ignoreFocusOut: true,
			placeHolder: "Example: 49.89,-97.14",
			value: ns_config.get<string>('location'),
			prompt: "Specify your location"
		})
	if(loc_str !== undefined)
	{
		await ns_config.update('location', loc_str, true);
	}
	recheck();
}

async function setConfigThemeDay()
{
	let theme_day = await window.showInputBox(
		{
			ignoreFocusOut: true,
			value: ns_config.get<string>('themeDay'),
			prompt: "Specify your day theme"
		})
	if(theme_day !== undefined)
	{
		await ns_config.update('themeDay', theme_day, true);
	}
	recheck();
}

async function setConfigThemeNight()
{
	let theme_night = await window.showInputBox(
		{
			ignoreFocusOut: true, 
			value: ns_config.get<string>('themeNight'), 
			prompt: "Specify your night theme"
		})
	if(theme_night !== undefined)
	{
		await ns_config.update('themeNight', theme_night, true);
	}
	recheck();
}

async function setConfigSunrise()
{
	let sr_str = await window.showInputBox(
		{
			ignoreFocusOut: true, 
			placeHolder: "Example: 6:00 AM",
			value: ns_config.get<string>('sunrise'),
			prompt: "Specify the time of sunrise"
		})
	if(sr_str !== undefined)
	{
		await ns_config.update('sunrise', sr_str, true);
	}
	recheck();
}

async function setConfigSunset()
{
	let ss_str = await window.showInputBox(
		{
			ignoreFocusOut: true, 
			placeHolder: "Example: 8:00 PM",
			value: ns_config.get<string>('sunset'),
			prompt: "Specify the time of sunset"
		})
	if(ss_str !== undefined)
	{
		await ns_config.update('sunset', ss_str, true);
	}
	recheck();
}

function switchThemeDay()
{
	disableAutoSwitch();
	setThemeDay();
}

function switchThemeNight()
{
	disableAutoSwitch();
	setThemeNight();
}

function toggleAutoSwitchEnabled()
{
	autoswitch_enabled = !autoswitch_enabled;
	recheck();
}


function parseCoordinates(coords: string)
{
	try
	{
		return new Coordinates(coords);
	}
	catch
	{
		window.showWarningMessage("Please set your coordinates in a valid format so that NightSwitch-lite can parse them (example: \"49.89,-97.14\").");
		return null;
	}
}

function setTheme(section: string)
{
	reloadWorkbenchConfig();
	let theme_name = ns_config.get(section);
	if(wb_config.get('colorTheme') !== theme_name)
	{
		let theme_config_info = ns_config.inspect(section);
		let target;
		if(theme_config_info.workspaceFolderValue !== undefined)
		{
			target = ConfigurationTarget.WorkspaceFolder;
		}
		else if(theme_config_info.workspaceValue !== undefined)
		{
			target = ConfigurationTarget.Workspace;
		}
		else
		{
			target = ConfigurationTarget.Global;
		}
		wb_config.update('colorTheme', theme_name, target)
	}
}

function setThemeNight()
{
	setTheme("themeNight");
}

function setThemeDay()
{
	setTheme("themeDay");
}

function disableAutoSwitch()
{
	if(autoswitch_enabled)
	{
		autoswitch_enabled = false;
		if(!has_shown_autoswitch_disabled_msg)
		{
			window.showInformationMessage('Automatic switching has been disabled for this session. ' +
									'To reenable, use the command "Enable Automatic Theme Switching".', 
									'Re-Enable', "Don't show this again"
									).then(
									function(str)
									{
										if(str === 'Re-Enable')
										{
											autoswitch_enabled = true;
											recheck();
										}
										else if(str === "Don't show this again")
										{
											has_shown_autoswitch_disabled_msg = true;
											ns_config.update('disableAutoSwitchNotifications', true, true);
										}
									});
		}
	}
}

function recheck()
{
	if(!autoswitch_enabled)
	{
		// dont do anything
		return;
	}
	
	reloadNightSwitchConfig();

	const curr_date = new Date();

	const location_str = ns_config.get<string>('location');
	const srise_str = ns_config.get<string>('sunrise');
	const sset_str  = ns_config.get<string>('sunset');

	let srise_time, sset_time;

	WiFiScanner.scan

	if(ns_config.get("geolocation"))
	{
		PublicIp.v4().then(ip => {
			let coords_arr = GeoIp.lookup(ip).ll;

			const tmp_hours = curr_date.getHours();
			curr_date.setHours(12);

			const calc_times = SunCalc.getTimes(curr_date, coords_arr[0], coords_arr[1]);

			curr_date.setHours(tmp_hours);

			srise_time = calc_times.sunrise.getTime();
			sset_time = calc_times.sunset.getTime();
		});
	}

	if(location_str)
	{

		let coords = parseCoordinates(location_str);

		// ensure we are at midday so we don't get any weird behavior
		const tmp_hours = curr_date.getHours();
		curr_date.setHours(12);

		const calc_times = SunCalc.getTimes(curr_date, coords.getLatitude(), coords.getLongitude());

		curr_date.setHours(tmp_hours);

		srise_time = calc_times.sunrise.getTime();
		sset_time = calc_times.sunset.getTime();

	}

	// takes precedence over location-based
	if(srise_str)
	{
		srise_time = parseManualTime(srise_str);
		if(!srise_time || Number.isNaN(srise_time))
		{
			window.showWarningMessage("Something went wrong with your manually set sunrise time. Please ensure you input a valid time.");
			return;
		}
	}

	if(sset_str)
	{
		sset_time = parseManualTime(sset_str);
		if(!sset_time || Number.isNaN(sset_time))
		{
			window.showWarningMessage("Something went wrong with your manually set sunset time. Please ensure you input a valid time.");
			return;
		}
	}

	if(srise_time === undefined || sset_time === undefined)
	{
		if(!has_shown_fix_settings_once)
		{
			window.showInformationMessage("You have not specified a location for NightSwitch-lite to use. Would you like to go through the setup? You can manually set it up later by going to your settings.",
				"Setup", "Go to settings.json").then(selection => {
					if(selection === "Setup")
					{
						setup();
					}
					else if(selection === "Go to settings.json")
					{
						commands.executeCommand("workbench.action.openSettings");
					}
				});
			has_shown_fix_settings_once = true;
		}
		return;
	}
	timeSwitch(curr_date.getTime(), srise_time, sset_time);
}


async function setup()
{

	// themeDay
	await setConfigThemeDay();

	// themeNight
	await setConfigThemeNight();

	// location
	await setConfigLocation();
	
}

function reloadWorkbenchConfig()
{
	// get the current workbench configuration
	wb_config = workspace.getConfiguration('workbench');
}

function reloadNightSwitchConfig()
{
	// get the user config for nightswitch
	let new_ns_config = workspace.getConfiguration('nightswitch');
	if(new_ns_config.get('autoSwitch') != ns_config.get('autoSwitch'))
	{
		autoswitch_enabled = new_ns_config.get('autoSwitch');
	}
	if(new_ns_config.get('disableAutoSwitchNotifications') != ns_config.get('disableAutoSwitchNotifications'))
	{
		has_shown_autoswitch_disabled_msg = new_ns_config.get('disableAutoSwitchNotifications');
	}
	ns_config = new_ns_config;
}
