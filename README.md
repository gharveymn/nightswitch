# NightSwitch

Automatically switches your VS Code theme between specified day and night themes.

## Features

Allows for automatic geolocation based on IP and manual GPS coordinate location.

Geolocation is not turn on out of the box to protect privacy, however if you want to turn it on just invoke the setting `"nightswitch.geolocation": true`.

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
	- forces the theme to switch to currently canonical theme, ie. if it is day and you have your theme set to something other than dayTheme, resets the theme to dayTheme.

## Known Issues

May have some synchronization issues. Haven't removed console logs yet, but the user won't see these.

## Release Notes

Allows for GPS coordinate location, geolocation, manual input.

### 0.0.1

Initial release. Still probably pretty buggy (I wrote this pretty hastily).
