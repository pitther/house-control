'use strict';

let TelegramToken = "";

const TeleBot = require('telebot');
const bot = new TeleBot(TelegramToken);

let superAdmins = [];

let text = {
  keyboard: {
    menu: "🖥 Menu",
    become_admin: "🔐‍Become admin",
    functions: "🎛 Functions",
    settings: "⚙️ Settings",
    admin_list: "📄 Admins list",
    generate_password: "🔐 Generate new password",
    get_password: "🔏 Get current password",
    log: "🗄 Activity log"
  }
}

class App {
  constructor(pw) {
    this.log = [];
    this.lists = {
      settings: [
        [text.keyboard.get_password, text.keyboard.generate_password],
        [text.keyboard.menu]
      ],
      menu: [
        [text.keyboard.functions],
        [text.keyboard.admin_list, text.keyboard.log],
        [text.keyboard.settings]
      ]
    }
    this.functions = new Map;
    this.password = pw;
    this.whiteList = new Map();
  }
  dispatchToAdmins(text) {

    this.whiteList.forEach(function(value, key, mapObj) {
      try {
        bot.sendMessage(key, text, {
          parseMode: 'markdown'
        });
      } catch (err) {

      }


    });

  }
  responsePack(send, markup, text) {
    let markup_ = bot.keyboard(markup, {
      resize: true
    });

    return {
      send: send,
      markup: markup_,
      text: text
    }
  }
  functionHandler() {

  }
  handler(msg) {
    if (msg.text == "/start") {

      if (!this.whiteList.has(msg.chat.id)) {
        return this.responsePack(true, [
          [text.keyboard.become_admin]
        ], "Hello, *" + msg.from.first_name + "*\n*Choose the command:* ");
      } else {
        return this.responsePack(true, [
          [text.keyboard.menu]
        ], "Hello, *" + msg.from.first_name + "*\nYou are admin.\nPress *Menu* to open control menu");
      }
    } else if (msg.text == text.keyboard.become_admin) {
      return this.responsePack(true, [
        ["👨🏿‍💻"]
      ], "Enter the password: ");
    } else if (msg.text == this.password) {
      if (this.addWhiteMember(msg)) {
        return this.responsePack(true, [
          [text.keyboard.menu]
        ], "🔓*You were successfully added to the admins list.*\nPress *Menu* to open control menu");
      } else {
        return this.responsePack(true, [
          [text.keyboard.menu]
        ], "🔓*You are already member of admin list*\nPress *Menu* to open control menu");
      }
    } else if (this.whiteList.has(msg.chat.id)) {
      let list = false;
      let add_text = "";
      if (msg.text == text.keyboard.menu) {
        //menu
        list = this.lists.menu;

      } else if (msg.text == text.keyboard.functions) {
        //functions
        let btns = [];
        list = [];
        let pair = [];
        this.functions.forEach(function(value, key, mapObj) {
          pair.push(value.name);
          if (pair.length >= 3) {
            list.push(pair);
            pair = [];
          }

        });
        list.push(pair);
        list.push([text.keyboard.menu]);
      } else if (this.functions.has(msg.text)) {
        let ls = this.functions.get(msg.text).inner_names;
        let name_ = this.functions.get(msg.text).name;

        let ls_ = [];
        for (let i = 0; i < ls.length; i++) {
          ls_[i] = [];
        }
        for (let i = 0; i < ls.length; i++) {
          for (let j = 0; j < ls[i].length; j++) {
            ls_[i][j] = name_ + ": " + ls[i][j];
          }
        }
        ls_.push([text.keyboard.functions, text.keyboard.menu]);
        list = ls_;
      } else if (this.functions.has(msg.text.split(': ')[0])) {
        add_text = this.functions.get(msg.text.split(': ')[0]).element.handler(msg.text.split(': ')[1]);

        let date = new Date();
        let date_str = '_' + date.getUTCDate() + '.' + (date.getUTCMonth() + 1) + '.' + date.getUTCFullYear() + ' ' + date.getHours() + ':' + date.getMinutes() + '_';
        let log_str = date_str + "  *" + msg.from.first_name + "* - " + msg.text.split(': ')[1];
        this.log.push(log_str);


        let ls = this.functions.get(msg.text.split(': ')[0]).inner_names;
        let name_ = this.functions.get(msg.text.split(': ')[0]).name;
        let ls_ = [];
        for (let i = 0; i < ls.length; i++) {
          ls_[i] = [];
        }
        for (let i = 0; i < ls.length; i++) {
          for (let j = 0; j < ls[i].length; j++) {
            ls_[i][j] = name_ + ": " + ls[i][j];
          }
        }
        ls_.push([text.keyboard.functions, text.keyboard.menu]);
        list = ls_;
      } else if (msg.text == text.keyboard.settings) {
        //settings

        list = this.lists.settings;
        console.log(list);
      } else if (msg.text == text.keyboard.admin_list) {
        //admin_list
        add_text = this.getAdminsList();
        list = [
          [text.keyboard.admin_list],
          [text.keyboard.menu]
        ];
      } else if (msg.text == text.keyboard.generate_password) {
        if (superAdmins.includes(msg.chat.id)) {
          let password = Math.random().toString(36).substring(7);
          console.log("New password: " + password);
          this.whiteList = new Map();
          this.whiteList.set(msg.chat.id, msg.from.first_name);
          this.password = password;
          add_text = "*The password has been successfully changed.*\nNew password is: *" + password + "*";
          list = this.lists.settings;

        } else {
          add_text = "*You have no privilege to change password.*";
          list = this.lists.settings;
        }
      } else if (msg.text == text.keyboard.get_password) {
        add_text = "Current password: *" + this.password + "*";
        list = this.lists.settings;
      } else if (msg.text == text.keyboard.log) {
        add_text = "*Activity log:*";
        for (let i = 0; i < this.log.length; i++) {
          add_text += "\n" + this.log[i];
        }
        list = this.lists.menu;
      }

      if (list) {
        return this.responsePack(true,
          list, msg.text + " : \n\n" + add_text);
      }

    }

    return this.responsePack(false, [], "");
  }
  getAdminsList() {
    let str = "";
    let i = 0;
    this.whiteList.forEach(function(value, key, mapObj) {
      i++;
      str += i + ". *" + value + "*\n";
    });
    return str;
  }
  addWhiteMember(msg) {

    if (!this.whiteList.has(msg.chat.id)) {
      this.whiteList.set(msg.chat.id, msg.from.first_name);
      return true;
    } else {
      return false;
    }

  }
}

class Function {
  constructor(name, inner_names, element) {
    this.name = name;
    this.inner_names = inner_names;
    this.element = element;
  }
}

var Gpio = require('onoff').Gpio;
class Bulb {
  constructor() {
    this.LED = new Gpio(4, 'out');
  }
  handler(t_) {
    if (t_ == 'On') {
      return this.enableBulb();
    } else if (t_ == 'Off') {
      return this.disableBulb();
    }
  }
  enableBulb() {
    this.LED.writeSync(1);

    return '*Bulb successfully enabled*';
  }
  disableBulb() {
    this.LED.writeSync(0);
    return '*Bulb successfully disabled*';
  }
}


class Motor {
  constructor() {
    this.edge_left = 700;
    this.edge_right = 2000;

    var Gpio1 = require('pigpio').Gpio;
    this.motor = new Gpio1(19, {
      mode: Gpio1.OUTPUT
    });
  }
  handler(t_) {
    if (t_ == "Open") {
      return this.moveLeft();
    } else if (t_ == "Close") {
      return this.moveRight();
    }
  }
  moveLeft() {
    this.motor.servoWrite(this.edge_left);
    return "Opened";
  }
  moveRight() {
    this.motor.servoWrite(this.edge_right);
    return "Closed";
  }

}

var sensor = require('node-dht-sensor');
class DHT_SENSOR {
  constructor() {
    this.FIRE_SENS_PIN = new Gpio(22, 'in');
    this.GAS_SENS_PIN = new Gpio(27, 'in');
    this.alert_frq = 4000;
    this.last_alert_gas = 0;
    this.last_alert_fire = 0;
    this.cnt = 0;
    this.data = {
      max_temp: -1000000,
      min_temp: 1000000,
      max_hum: -1000000,
      min_hum: 1000000,
      avg_temp: 0,
      avg_hum: 0,
      temp: 0,
      hum: 0,
      fire: 0,
      str: 'No data'
    };
    this.pool_interval = 300;
    setInterval(function() {
      this.pool();
    }.bind(this), this.pool_interval);
  }
  pool() {
    sensor.read(11, 17, function(err, temperature, humidity) {
      if (!err) {
        this.cnt++;
        this.data.avg_temp = (this.data.avg_temp * (this.cnt - 1) + temperature) / this.cnt;
        this.data.avg_temp = this.data.avg_temp.toFixed(1);

        this.data.avg_hum = (this.data.avg_hum * (this.cnt - 1) + temperature) / this.cnt;
        this.data.avg_hum = this.data.avg_hum.toFixed(1);
        if (temperature.toFixed(1) > this.data.max_temp) {
          this.data.max_temp = temperature.toFixed(1);
        }
        if (temperature.toFixed(1) < this.data.min_temp) {
          this.data.min_temp = temperature.toFixed(1);
        }
        if (humidity.toFixed(1) > this.data.max_hum) {
          this.data.max_hum = humidity.toFixed(1);
        }
        if (humidity.toFixed(1) < this.data.min_hum) {
          this.data.min_hum = humidity.toFixed(1);
        }

        this.data.temp = temperature.toFixed(1);
        this.data.hum = humidity.toFixed(1);
        this.data.str = '🌡Temp: *' + temperature.toFixed(1) + '* °C \n💧Hum: *' + humidity.toFixed(1) + '* %\n\n' + this.data.fire_str + '\n' + this.data.gas_str;
      }
    }.bind(this));

    if (this.GAS_SENS_PIN.readSync() == 1) {
      this.data.gas = 0;
      this.data.gas_str = "🌫 Gas: OK";
    } else if (this.GAS_SENS_PIN.readSync() == 0) {
      this.data.gas = 1;
      this.data.gas_str = "🌫 Gas: *GAS ALARM*";
      if (Date.now() - this.last_alert_gas > this.alert_frq) {
        app.dispatchToAdmins("*❗️Warning:  🌫GAS ALARM*");
        this.last_alert_gas = Date.now();
      }
    }

    if (this.FIRE_SENS_PIN.readSync() == 1) {
      this.data.fire = 0;
      this.data.fire_str = "🔥 Fire: OK";
    } else if (this.FIRE_SENS_PIN.readSync() == 0) {
      this.data.fire = 1;
      this.data.fire_str = "🔥 Fire: *FIRE ALARM*";
      if (Date.now() - this.last_alert_fire > this.alert_frq) {
        app.dispatchToAdmins("*❗️Warning:  🔥FIRE ALARM*");
        this.last_alert_fire = Date.now();
      }
    }
  }
  handler(t_) {
    if (t_ == "Get current data") {
      return this.data.str;
    } else if (t_ == "Max Temp") {
      return "🌡Max Temp: *" + this.data.max_temp + "* °C";
    } else if (t_ == "Min Temp") {
      return "🌡Min Temp: *" + this.data.min_temp + "* °C";
    } else if (t_ == "Max Hum") {
      return '💧Max Hum: *' + this.data.max_hum + '* %';
    } else if (t_ == "Min Hum") {
      return '💧Min Hum: *' + this.data.min_hum + '* %';
    } else if (t_ == "Avg Temp") {
      return "🌡Avg Temp: *" + this.data.avg_temp + "* °C";
    } else if (t_ == "Avg Hum") {
      return "💧Avg Hum: *" + this.data.avg_hum + "* %";
    }
  }
}



let app = new App("PASSWORD");

app.functions.set("⏲ Servo", new Function("⏲ Servo", [
  ["Open", "Close"]
], new Motor()));
app.functions.set("📈 Sensors", new Function("📈 Sensors", [
  ["Get current data"],
  ["Max Temp", "Min Temp", "Avg Temp"],
  ["Max Hum", "Min Hum", "Avg Hum"]
], new DHT_SENSOR()));
app.functions.set("💡 Light", new Function("💡 Light", [
  ["On", "Off"]
], new Bulb()));

bot.on('text', (msg) => {
  let response = app.handler(msg);
  if (response.send) {
    let replyMarkup = response.markup;
    bot.sendMessage(msg.chat.id, response.text, {
      parseMode: 'markdown',
      replyMarkup
    });
  }
});

bot.start();
