# homebridge-re-yeelight-ble
[![npm version](https://badge.fury.io/js/homebridge-re-yeelight.svg)](https://badge.fury.io/js/homebridge-re-yeelight)

Yeelight BLE plugin for homebridge(Rewrited)   
   
Thanks for [nfarina](https://github.com/nfarina)(the author of [homebridge](https://github.com/nfarina/homebridge)), all other developer and testers.   

## Supported Types
1.BedsideLamp

## Installation
1. Install HomeBridge, please follow it's [README](https://github.com/nfarina/homebridge/blob/master/README.md).   
If you are using Raspberry Pi, please read [Running-HomeBridge-on-a-Raspberry-Pi](https://github.com/nfarina/homebridge/wiki/Running-HomeBridge-on-a-Raspberry-Pi).   
2. Make sure you can see HomeBridge in your iOS devices, if not, please go back to step 1.   
3. Install packages.   
```
1. sudo apt-get install libbluetooth-dev

2. sudo npm install -g noble

3. sudo apt-get install libcap2-bin

4. Run following command:
```sh
sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
``` 

npm install -g homebridge-re-yeelight
```
## Configuration
```
"platforms": [
    {
        "platform": "ReYeelightPlatform",
    }]
```

Wait until you get output.   
For more information about token, please refer to [OpenMiHome](https://github.com/OpenMiHome/mihome-binary-protocol) and [miio](https://github.com/aholstenson/miio).   
## Version Logs 
### 0.0.1
1.add support for BedsideLamp.
