# NightSwitch

Automatically switches your VS Code theme between specified day and night themes. There is a [lighter version](https://marketplace.visualstudio.com/items?itemName=gharveymn.nightswitch-lite) without geolocation.

*Size warning: this extension will take up about 86 MB because of the geolocation feature. If you don't want that just install [NightSwitch-Lite](https://marketplace.visualstudio.com/items?itemName=gharveymn.nightswitch-lite) (you can still manually set your location).*

## Quickstart

If you want the geolocation feature, install the extension and go to your preferences. Add the settings 
~~~
"nightswitch.dayTheme": "[YourDayTheme]"
"nightswitch.nightTheme": "[YourNightTheme]"
"nightswitch.geolocation": true
~~~

## Features

Allows for automatic geolocation based on IP and manual GPS coordinate location.

Geolocation is not turned on out of the box to protect privacy, however if you want to turn it on just invoke the setting 
~~~
"nightswitch.geolocation": true
~~~

Note for GitHub: This extension requires the node modules `suncalc`, `geoip-lite`, and `public-ip`. Install those with 
~~~
npm install suncalc
npm install geoip-lite
npm install public-ip
~~~
in this folder. You'll also need the .vscode folder, which you can create using Yeoman or something.

## Requirements

None. Probably safer to set your main theme to either the day or night theme from the outset though.

## Extension Settings


- `"nightswitch.dayTheme"` 
	- sets the theme to be shown during the day (eg. `"Solarized Light"`)
- `"nightswitch.nightTheme"` 
	- sets the theme to be shown at night (eg. `"Default Dark+"`)
- `"nightswitch.location"`
	- specifies a user defined GPS location in decimal degrees (eg. `"(49.89,-97.14)"`)
- `"nightswitch.geolocation"`
	- specifies whether to infer user location based on IP address (default `false`)
- `"nightswitch.sunrise"`
	- manually sets the time to switch theme to day, with priority over location (24hr time, eg. `"6:00"`)
- `"nightswitch.sunset"`
	- manually sets the time to switch theme to night, with priority over location (24hr time, eg. `"18:00"`)
- `"nightswitch.forceSwitch"`
	- forces the theme to switch to currently canonical theme, ie. if it is day and you have your theme set to something other than `nightswitch.dayTheme`, resets the theme to `nightswitch.dayTheme` (default `true`).


## Extension Commands

- `Toggle Day/Night`
	- toggles the theme between day and night
- `Switch to Day Theme`
	- switches the theme to `nightswitch.dayTheme`
- `Switch to Night Theme`
	- switches the theme to `nightswitch.nightTheme`

## [CHANGELOG](https://github.com/gharveymn/nightswitch/blob/master/CHANGELOG.md)

### 1.0.6
Should fix the issue where we were using local ip addresses rather than public.

### 1.0.5
Fixes issue where manually setting the time didn't do anything.

### 1.0.4
Fixes bug where `nightswitch.geolocation` did not have the same name in the code

### 1.0.1
Updates readme

### 1.0.0
Removes useless line updating the location setting from geolocation

### 0.1.1
Corrects version number

### 0.1.0
Gives priority to location. If using geolocation updates location to decrease workload.

### 0.0.3
Creates changelog and updates docs 

### 0.0.2
Changes to documentation, fixes a couple of bugs with commands

### 0.0.1
Initial release. Still probably pretty buggy (I wrote this pretty hastily).
