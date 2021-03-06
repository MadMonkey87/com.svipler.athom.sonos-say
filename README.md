# Sonos Say

Let's you broadcast text to your Sonos system

[![current version](https://img.shields.io/badge/version-4.0.0-<COLOR>.svg)](https://shields.io/)

V4.0.0
* Fixed app manifest
* Fixed german translations
* Fix s.t searching in the speaker dropdowns work
* Sort speakers in all dropdowns
* Do not setup an entire http server and instead use the library directly which is more efficient and less error prone - and works with sdk>=3
* Removed unnecessary files
* Upgraded sdk to v3 to be ready for the future
* Flow card to delete the cache if necessary
* App config to upload audio clips to homey
* Flow card to play (random) audio clips

V3.1.4
* Reduced filesize by removing some unwanted options

V3.1.3
* Added Toggle Mute
* Small fixes

V3.1.2
* Added Clear Queueu
* Coding improvements

V3.1.1
* Added TV as a input source
* General improvements

V3.0.0
* No need to install node-sonos-http-api externally. Big thanks to Arie J. Godschalk

V2.0.1
* small fixes

V2.0.0
* generally rebuilt
* improved flow card that allows you to set the speaker, language and volume directly
* more flow cards to control shuffling, repeat mode, sleep mode and locking volumes
* fixed some bugs
* because it works a lot different this update is propably not backwards compatible, sorry!

V1.0.0
* Initial release


# Installation
1. Clone repo
2. npm install
3. npm install -g homey (Update Homey sdk if not done yet)
4. Install to Athom (athom app install)

# Contributor
Special thanks to Arie J. Godschalk who made Version 3 serverless
https://github.com/XeroxQ

Special thanks to MadMonkey87 who made most of Version 2 and 4
https://github.com/MadMonkey87/
