# homebridge-re-yeelight-ble
[![npm version](https://badge.fury.io/js/homebridge-re-yeelight-ble.svg)](https://badge.fury.io/js/homebridge-re-yeelight-ble)

Yeelight BLE plugin for homebridge(Rewrited)   
   
Thanks for [nfarina](https://github.com/nfarina)(the author of [homebridge](https://github.com/nfarina/homebridge)), all other developer and testers.   

## Supported Types
1.BedsideLamp

## Installation
1. Install HomeBridge, please follow it's [README](https://github.com/nfarina/homebridge/blob/master/README.md).   
If you are using Raspberry Pi, please read [Running-HomeBridge-on-a-Raspberry-Pi](https://github.com/nfarina/homebridge/wiki/Running-HomeBridge-on-a-Raspberry-Pi).   
2. Make sure you can see HomeBridge in your iOS devices, if not, please go back to step 1.   
3. Install packages.   
4. Install Plugin.

## Install packages
1. ```sudo apt-get install libbluetooth-dev```  

2. Go to your node_modules folder  
(You can find it by using by ```npm -g root```)

3. ```npm install noble```  

4. ```sudo apt-get install libcap2-bin```  

5. Run following command:
```sh
sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
```

6. Run following command:
```sh
sudo hciconfig hci0 up
```

Then start homebridge  
Wait until you get output.    
If you found output like this: 
```
[ReYeelight][BLE]Timer Started
```
You can be sure that noble and bluetooth has no problem and the plugin is running properly


## Configuration
```
"platforms": [
	{
		"platform": "ReYeelightBLEPlatform",
		"defaultValue": {
			"f8:24:41:e9:fa:cf": "Bedside Lamp"
		}
	}
]
```
  
## Version Logs 
### 0.0.4
1.remove dependencies
### 0.0.3
1.fix rgb
### 0.0.2
1.bug fix
### 0.0.1
1.add support for BedsideLamp.
