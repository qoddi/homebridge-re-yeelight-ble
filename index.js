require('./BlueTooth/BLEHelper');

var fs = require('fs');
var packageFile = require("./package.json");
var PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
    if(!isConfig(homebridge.user.configPath(), "platforms", "ReYeelightBLEPlatform")) {
        return;
    }
    
    PlatformAccessory = homebridge.platformAccessory;
    Accessory = homebridge.hap.Accessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform('homebridge-re-yeelight-ble', 'ReYeelightBLEPlatform', ReYeelightBLEPlatform, true);
}

function isConfig(configFile, type, name) {
    var config = JSON.parse(fs.readFileSync(configFile));
    if("accessories" === type) {
        var accessories = config.accessories;
        for(var i in accessories) {
            if(accessories[i]['accessory'] === name) {
                return true;
            }
        }
    } else if("platforms" === type) {
        var platforms = config.platforms;
        for(var i in platforms) {
            if(platforms[i]['platform'] === name) {
                return true;
            }
        }
    } else {
    }
    
    return false;
}

function ReYeelightBLEPlatform(log, config, api) {
    if(null == config) {
        return;
    }
    
    this.Accessory = Accessory;
    this.PlatformAccessory = PlatformAccessory;
    this.Service = Service;
    this.Characteristic = Characteristic;
    this.UUIDGen = UUIDGen;
    
    this.log = log;
    this.config = config;

    if (api) {
        this.api = api;
    }
    
	this.deletingacc = [];
    
    this.log.info("[ReYeelight][INFO]*********************************************************************");
    this.log.info("[ReYeelight][INFO]*                         ReYeelightBLE v%s                      *",packageFile.version);
    this.log.info("[ReYeelight][INFO]*   GitHub: https://github.com/Zzm317/homebridge-re-yeelight-ble    *");
    this.log.info("[ReYeelight][INFO]*                                                                   *");
    this.log.info("[ReYeelight][INFO]*********************************************************************");
    this.log.info("[ReYeelight][INFO]start success...");
    var blehelper = new BLEHelper(this);
	
	this.api.on('didFinishLaunching', function() {
	    this.log.info("[ReYeelight][BLE]start Cleaning!");
	    this.clearAccessory();
	    
	}.bind(this));
}

ReYeelightBLEPlatform.prototype.registerAccessory = function(accessory) {
    this.api.registerPlatformAccessories('homebridge-re-yeelight-ble', 'ReYeelightBLEPlatform', [accessory]);
}

ReYeelightBLEPlatform.prototype.configureAccessory = function(accessory) {
	this.deletingacc.push(accessory);
}

ReYeelightBLEPlatform.prototype.clearAccessory = function(accessory) {
    for (var i in this.deletingacc) {
        Accessory = this.deletingacc[i];
		this.log.info("[ReYeelight][BLE]Deleting " + Accessory.UUID);
        this.api.unregisterPlatformAccessories('homebridge-re-yeelight-ble', 'ReYeelightBLEPlatform', [Accessory]);
    }
}

ReYeelightBLEPlatform.prototype.getNameFormConfig = function(macaddress) {
	var defaultValueCfg = this.config['defaultValue'];
	if(null != defaultValueCfg) {
		if(null != defaultValueCfg[macaddress]) {
			return defaultValueCfg[macaddress];
		}
	}
	return false;
}
    