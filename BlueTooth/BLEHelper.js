require('./Base');
const inherits = require('util').inherits;
var PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;
var noble = null;
var timer;
var yeeLamps = {};
var BS_LAMP_NAME = 'XMCTD_';
var SERVICE_UUID = '8e2f0cbd1a664b53ace6b494e25f87bd';
var NOTIFY_CHARACT_UUID = '8f65073d9f574aaaafea397d19d5bbeb';
var COMMAND_CHARACT_UUID = 'aa7d3f342d4f41e0807f52fbf8cf7443';
var bleCmd = [];
bleCmd.length = 18;

BLEHelper = function(platform) {
    this.init(platform);
    this.platform.log.info("[ReYeelight]Loading BLE");
    Accessory = platform.Accessory;
    PlatformAccessory = platform.PlatformAccessory;
    Service = platform.Service;
    Characteristic = platform.Characteristic;
    UUIDGen = platform.UUIDGen;
    var that = this;
    this.statee = true;
    this.yeeLamps = new Array();
    try {
        this.noble = require('noble');
    } catch (ex) {
        this.statee = false;
        this.platform.log.error("[ReYeelight]Unable to load BLE");
    }
    if(this.statee){
        this.noble.on('stateChange', function(state) {
            if (state == 'poweredOn') {
                that.timer = true;
                that.updateTimer();
                that.platform.log.info("[ReYeelight][BLE] Timer Started");
            } else {
                that.timer = false;
                that.platform.log.error("[ReYeelight]NoBle Powered off");
            }
        });
        this.noble.on('discover', function(peripheral) {
            if(peripheral.advertisement.localName == BS_LAMP_NAME) {
                var id = peripheral['id'];
                if (id in that.yeeLamps) {
                    that.platform.log.debug("[ReYeelight][BLE] " + peripheral['address'] + " already in device list!");
                } else {
                    //peripheral.disconnect();
                    that.platform.log.info("[ReYeelight][BLE]Found " + peripheral['address']);
                    that.yeeLamps[id] = new YeeBleLamp(that,peripheral);
                }
            }
        });
    }
    return null;
}
inherits(BLEHelper, Base);

BLEHelper.prototype.updateTimer = function() {
    if (this.timer) {
        clearTimeout(this.timer);
        this.timer = setTimeout(function() {
            this.SearchTimer();
            this.updateTimer();
        }.bind(this), 6100);
    }
}

BLEHelper.prototype.SearchTimer = function() {
    var that = this;
    if(this.timer){
        this.noble.startScanning();
        var _timeout = 5000;
        setTimeout(function() {
            that.noble.stopScanning();
        }, _timeout);
    }
}

YeeBleLamp = function(dThis,peripheral){
    var that = this;
    this.peripheral = peripheral;
    this.platform = dThis.platform;
    this.commandCharact;
    this.connectionstatus = false;
    this.cannotify = false;
    this.LampService = false;
    this.LampStatus = false;
    this.sat = 100;
    this.hue = 0;
    this.platform.log.info("[ReYeelight][BLEDevice]Device Added " + peripheral['address']);
    this.ConnectDevice(peripheral);
}

YeeBleLamp.prototype.ConnectDevice = function(peripheral) {
    var that = this;
    that.platform.log.info("[ReYeelight][BLEDevice]Connecting " + peripheral['address']);     
    peripheral.connect(function(error) {
        if (error < 0) {
            that.platform.log.error("[ReYeelight][BLEDevice]failed to connect!");
        } else {
            peripheral.discoverServices(['8e2f0cbd1a664b53ace6b494e25f87bd'], function(error, services) {
                that.platform.log.info("[ReYeelight][BLEDevice]Discovered Service"); 
                var deviceInformationService = services[0];
             
                deviceInformationService.discoverCharacteristics(
                     ['aa7d3f342d4f41e0807f52fbf8cf7443', '8f65073d9f574aaaafea397d19d5bbeb'], 
                     function(error, characteristics) {
                         that.commandCharact = characteristics[0]; 
                         that.notifyCharact = characteristics[1]; 
                         that.notifyCharact.on('data', function(data, isNotify) {
                             that.handleBLENotify(data, isNotify);
                         });
                         that.notifyCharact.subscribe(function(error) {
                             // 43 67 for auth
                             bleCmd[0] = 0x43;
                             bleCmd[1] = 0x67;
                             // deadbeef as magic for our Pi
                             bleCmd[2] = 0xde;
                             bleCmd[3] = 0xad;
                             bleCmd[4] = 0xbe;
                             bleCmd[5] = 0xbf;

                             that.SendCmd(bleCmd);
                             that.platform.log.info('[ReYeelight][BLEDevice]notifications turned on');
                             this.connectionstatus = true;
                             that.Pair();
                       });
                });
            });
        }
    });
}

YeeBleLamp.prototype.Pair = function() {
    var that = this;
    that.platform.log.debug('[ReYeelight][BLEDevice]send pairing command');
    that.commandCharact.write(Buffer.from('436702000000000000000000000000000000', 'hex'), false, function(error) {
        if (!error) {
            that.platform.log.info('[ReYeelight][BLEDevice][BLE]Pair Success');
            that.connectionstatus = true;
        } else {
            that.platform.log.error('[ReYeelight][BLEDevice][BLE]error');
        }
    });
    this.InitAccessory();
}

YeeBleLamp.prototype.InitAccessory = function() {
    var that = this;
    var services = [];
    var tokensan = this.peripheral.id;
    this.name = tokensan.substring(tokensan.length-8);
    uuid = UUIDGen.generate(tokensan + Date.now());
    newAccessory = new PlatformAccessory(this.name, uuid);
    var infoService = newAccessory.getService(Service.AccessoryInformation);
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "YeeLight")
        .setCharacteristic(Characteristic.Model, "BedsideLamp")
        .setCharacteristic(Characteristic.SerialNumber, tokensan);
    services.push(infoService);
    var BedsideLampServices = new Service.Lightbulb(this.name, "BedsideLamp");
    var BedsideLampOnCharacteristic = BedsideLampServices.getCharacteristic(Characteristic.On);
    BedsideLampServices
        .addCharacteristic(Characteristic.Hue)
        .setProps({
            minValue: 0,
            maxValue: 360,
            minStep: 1
        });
    BedsideLampOnCharacteristic
        .on('get', function(callback) {
            callback(null,true);
        }.bind(this))
        .on('set', function(value, callback) {
            this.LampStatus = value;
            var astatus = value ? "on" : "off";
            if(astatus == "on"){
                this.TurnOn();
            }else{
                this.TurnOff();
            }
            callback(null,value);
        }.bind(this));
    BedsideLampServices
        .addCharacteristic(Characteristic.Brightness)
        .on('get', function(callback) {
            callback(null,100);
        }.bind(this))
        .on('set', function(value, callback) {
            if(value > 0) {
                this.SetBrightness(value);
                callback(null);
            } else {
                callback(null);
            }
        }.bind(this));
    BedsideLampServices
        .getCharacteristic(Characteristic.Hue)
        .on('get', function(callback) {
            callback(null,this.hue);
        }.bind(this))
        .on('set', function(value, callback) {
            this.SetColour(value,this.sat);
            callback(null);
        }.bind(this));
    BedsideLampServices
        .addCharacteristic(Characteristic.Saturation)
        .on('get', function(callback) {
            callback(null,this.sat);
        }.bind(this))
        .on('set', function(value, callback) {
            this.SetColour(this.hue,value);
            callback(null);
        }.bind(this));
    services.push(BedsideLampServices); 
    newAccessory.addService(BedsideLampServices, this.name);
    this.LampService = newAccessory;
    that.platform.registerAccessory(newAccessory); 
    this.LampService.getService(this.name).getCharacteristic(Characteristic.On).updateValue(true);
    this.cannotify = true;
    return services;
}
    
YeeBleLamp.prototype.TurnOn = function() {
    var that = this;
    that.platform.log.debug('[ReYeelight][BLEDevice]send turn On command');
    that.commandCharact.write(Buffer.from('434001000000000000000000000000000000', 'hex'), false, function(error) {
        if (!error) {
            that.platform.log.info('[ReYeelight][BLEDevice][BLE]Turn On Success');
            that.connectionstatus = true;
        } else {
            that.platform.log.error('[ReYeelight][BLEDevice][BLE]error');
        }
    });
}

YeeBleLamp.prototype.TurnOff = function() {
    var that = this;
    that.platform.log.debug('[ReYeelight][BLEDevice]send turn Off command');
    that.commandCharact.write(Buffer.from('434002000000000000000000000000000000', 'hex'), false, function(error) {
        if (!error) {
            that.platform.log.info('[ReYeelight][BLEDevice][BLE]Turn Off Success');
            that.connectionstatus = true;
        } else {
            that.platform.log.error('[ReYeelight][BLEDevice][BLE]error');
        }
    });
}

YeeBleLamp.prototype.SetBrightness = function(brightness) {
    var that = this;
    bleCmd[0] = 0x43;
    bleCmd[1] = 0x42;
    bleCmd[2] = parseInt(brightness.toString(16), 16);
    that.platform.log.debug('[ReYeelight][BLEDevice]Set Brightness To: ' + brightness);
    this.SendCmd(bleCmd);
}

YeeBleLamp.prototype.SetColour = function(hue,sat) {
    var that = this;
    this.hue = hue;
    this.sat = sat;
    rgb = this.hsv2rgb(parseFloat(hue/360), parseFloat(sat/100), 1);
    that.platform.log.debug('[ReYeelight][BLEDevice]Set RGB To: ' + rgb);
    bleCmd[0] = 0x43;
    bleCmd[1] = 0x41;
    bleCmd[2] = parseInt(rgb.r.toString(16), 16);
    bleCmd[3] = parseInt(rgb.g.toString(16), 16);
    bleCmd[4] = parseInt(rgb.b.toString(16), 16);
    bleCmd[5] = 0xFF;
    bleCmd[6] = 0x65;

    this.SendCmd(bleCmd);
}
        
YeeBleLamp.prototype.SendCmd = function(cmd) {
    var that = this;
    that.platform.log.debug('[ReYeelight][BLEDevice]sending command');
    that.commandCharact.write(new Buffer(cmd), false, function(error) {
        if (!error) {
            that.platform.log.debug('[ReYeelight][BLEDevice][BLE][SendCmd]Success');
            that.connectionstatus = true;
        } else {
            that.platform.log.error('[ReYeelight][BLEDevice][BLE][SendCmd]error');
        }
    });
}

YeeBleLamp.prototype.handleBLENotify = function(data, isNotify) {
    var that = this;
    if(that.cannotify){
        if (data[0] == 0x43 && data[1] == 0x45) { 
            if (data[2] == 1)
                this.LampService.getService(this.name).getCharacteristic(Characteristic.On).updateValue(true);
            else 
                this.LampService.getService(this.name).getCharacteristic(Characteristic.On).updateValue(false);

            this.LampService.getService(this.name).getCharacteristic(Characteristic.Brightness).updateValue(data[8]);
            that.platform.log.debug("power: " + data[2] + " bright: " + data[8]);
        } 
    }
}

YeeBleLamp.prototype.hsv2rgb = function (h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }

    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}
