# NightSwitch

Automatically switches your VS Code theme between specified day and night themes.

## Features

Allows for automatic geolocation based on IP and manual GPS coordinate location.

Geolocation is not turned on out of the box to protect privacy, however if you want to turn it on just invoke the setting 
~~~
"nightswitch.geolocation": true
~~~

## Requirements

None. Probably safer to set your main theme to either the day or night theme from the outset though.

## Extension Settings


- `"nightswitch.dayTheme"` 
	- sets the theme to be shown during the day (eg. "Solarized Light")
- `"nightswitch.nightTheme"` 
	- sets the theme to be shown at night (eg. "Default Dark+")
- `"nightswitch.location"`
	- specifies a user defined GPS location in decimal degrees (eg. \"(49.89,-97.14)\")
- `"nightswitch.useGeoLocation"`
	- specifies whether to infer user location based on IP address (default false)
- `"nightswitch.sunrise"`
	- manually sets the time to switch theme to day
- `"nightswitch.sunset"`
	- manually sets the time to switch theme to night
- `"nightswitch.forceSwitch"`
	- forces the theme to switch to currently canonical theme, ie. if it is day and you have your theme set to something other than `nightswitch.dayTheme`, resets the theme to `nightswitch.dayTheme`.


## Extension Commands

- `Toggle Day/Night`
	- toggles the theme between day and night
- `Switch to Day Theme`
	- switches the theme to `nightswitch.dayTheme`
- `Switch to Night Theme`
	- switches the theme to `nightswitch.nightTheme`

## Known Issues

May have some synchronization issues. Haven't removed console logs yet, but you won't see these.

This extension is also way too big right now because of the geoip feature. This is sort of on my todo list, but if someone wants to do that for me I would be soooooooo happy.

## [CHANGELOG](https://github.com/gharveymn/nightswitch/blob/master/CHANGELOG.md)

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
