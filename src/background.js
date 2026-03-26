import axios from "axios";

var Interval;
var holiday;
var RealtimeFundcode = null;
var RealtimeIndcode = null;
var fundListM = [];
var showBadge = 1;
var BadgeContent = 1;
var BadgeType = 1;
var userId = null;

var getGuid = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (
    c
  ) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
var getHoliday = () => {
  let url = "https://x2rr.github.io/funds/holiday.json";
  return axios.get(url);
};
var checkHoliday = date => {
  var nowMonth = date.getMonth() + 1;
  var nowYear = date.getFullYear();
  var strDate = date.getDate();
  if (nowMonth >= 1 && nowMonth <= 9) {
    nowMonth = "0" + nowMonth;
  }
  if (strDate >= 0 && strDate <= 9) {
    strDate = "0" + strDate;
  }

  let check = false;
  var nowDate = nowMonth + "-" + strDate;
  let holidayList = holiday.data;
  for (const year in holidayList) {
    if (holidayList.hasOwnProperty(year)) {
      const yearData = holidayList[year];
      if (year == nowYear) {
        for (const day in yearData) {
          if (yearData.hasOwnProperty(day)) {
            const dayData = yearData[day];
            if (nowDate == day && dayData.holiday) {
              check = true;
            }
          }
        }
      }
    }
  }
  return check;
};

var toNum = a => {
  var a = a.toString();
  var c = a.split(".");
  var num_place = ["", "0", "00", "000", "0000"],
    r = num_place.reverse();
  for (var i = 0; i < c.length; i++) {
    var len = c[i].length;
    c[i] = r[len] + c[i];
  }
  var res = c.join("");
  return res;
};

var cpr_version = (a, b) => {
  var _a = toNum(a),
    _b = toNum(b);
  if (_a == _b) console.log("版本号相同！版本号为：" + a);
  if (_a > _b) console.log("版本号" + a + "是新版本！");
  if (_a < _b) console.log("版本号" + b + "是新版本！");
};

var isDuringDate = () => {

  //时区转换为东8区
  var zoneOffset = 8;
  var offset8 = new Date().getTimezoneOffset() * 60 * 1000;
  var nowDate8 = new Date().getTime();
  var curDate = new Date(nowDate8 + offset8 + zoneOffset * 60 * 60 * 1000);

  if (checkHoliday(curDate)) {
    return false;
  }
  var beginDateAM = new Date();
  var endDateAM = new Date();
  var beginDatePM = new Date();
  var endDatePM = new Date();

  beginDateAM.setHours(9, 30, 0);
  endDateAM.setHours(11, 35, 0);
  beginDatePM.setHours(13, 0, 0);
  endDatePM.setHours(15, 5, 0);
  if (curDate.getDay() == "6" || curDate.getDay() == "0") {
    return false;
  } else if (curDate >= beginDateAM && curDate <= endDateAM) {
    return true;
  } else if (curDate >= beginDatePM && curDate <= endDatePM) {
    return true;
  } else {
    return false;
  }
};

var formatNum = val => {
  let num = parseFloat(val);
  let absNum = Math.abs(num);
  if (absNum < 10) {
    return num.toFixed(2);
  } else if (absNum < 100) {
    return num.toFixed(1);
  } else if (absNum < 1000) {
    return num.toFixed(0);
  } else if (absNum < 10000) {
    return (num / 1000).toFixed(1) + 'k';
  } else if (absNum < 1000000) {
    return (num / 1000).toFixed(0) + 'k';
  } else if (absNum < 10000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else {
    return (num / 1000000).toFixed(0) + 'M';
  }
}

var isEtf = (code) => /^(15[09]|51[0-9]|56[1-3]|588)/.test(code);
var etfSecid = (code) => (/^15/.test(code) ? "0." : "1.") + code;

var fetchFundData = (codes) => {
  const regular = codes.filter((c) => !isEtf(c));
  const etf = codes.filter((c) => isEtf(c));

  const regularRequests = regular.map((code) =>
    axios
      .get("https://fundgz.1234567.com.cn/js/" + code + ".js")
      .then((res) => {
        const match = res.data.match(/\((\{.+\})\)/);
        if (!match) return null;
        const d = JSON.parse(match[1]);
        return {
          FCODE: d.fundcode,
          NAV: parseFloat(d.dwjz),
          GSZ: parseFloat(d.gsz),
          GSZZL: parseFloat(d.gszzl),
          GZTIME: d.gztime,
          PDATE: d.jzrq,
        };
      })
      .catch(() => null)
  );

  const etfRequest =
    etf.length > 0
      ? axios
          .get(
            "https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f12,f13,f14&secids=" +
              etf.map(etfSecid).join(",") +
              "&_=" +
              new Date().getTime()
          )
          .then((res) => {
            const diff = (res.data.data && res.data.data.diff) || [];
            return diff.map((item) => ({
              FCODE: item.f12,
              NAV: item.f2 - item.f4,
              GSZ: item.f2,
              GSZZL: isNaN(item.f3) ? 0 : parseFloat(item.f3),
              GZTIME: new Date().toTimeString().substr(0, 5),
              PDATE: new Date().toISOString().substr(0, 10),
            }));
          })
          .catch(() => [])
      : Promise.resolve([]);

  return Promise.all([Promise.all(regularRequests), etfRequest]).then(
    ([regularData, etfData]) =>
      [...regularData.filter((d) => d !== null), ...etfData]
  );
};

var setBadge = (fundcode, Realtime, type) => {
  let fundStr = null;
  if (type == 3) {
    let url =
      "https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f3&secids=" +
      fundcode +
      "&_=" +
      new Date().getTime();
    axios.get(url).then((res) => {
      let data = res.data.data.diff;
      let text = data[0].f3.toString();
      let num = data[0].f3;
      chrome.browserAction.setBadgeText({
        text: text
      });
      let color = Realtime ?
        num >= 0 ?
        "#F56C6C" :
        "#4eb61b" :
        "#4285f4";
      chrome.browserAction.setBadgeBackgroundColor({
        color: color
      });
    });
  } else {
    let codes = type == 1 ? [fundcode] : fundListM.map((val) => val.code);

    fetchFundData(codes).then((datas) => {
        let allAmount = 0;
        let allGains = 0;
        let textStr = null;
        let sumNum = 0;

        if (type == 1) {
          let val = datas[0];
          if (!val) return;
          let slt = fundListM.filter((item) => item.code == val.FCODE);
          if (!slt.length) return;
          let num = slt[0].num ? slt[0].num : 0;
          let sum = val.GSZ ? ((val.GSZ - val.NAV) * num).toFixed(1) : 0;

          if (BadgeType == 1) {
            textStr = String(val.GSZZL);
            sumNum = val.GSZZL;
          } else {
            if (num != 0) {
              sumNum = sum;
              textStr = formatNum(sum);
            } else {
              sumNum = "0";
              textStr = "0";
            }
          }
        } else {
          datas.forEach((val) => {
            let slt = fundListM.filter((item) => item.code == val.FCODE);
            let num = slt[0] && slt[0].num ? slt[0].num : 0;
            allAmount += val.NAV * num;
            let sum = val.GSZ ? (val.GSZ - val.NAV) * num : 0;
            allGains += sum;
          });
          if (BadgeType == 1) {
            if (allAmount == 0 || allGains == 0) {
              sumNum = "0";
              textStr = "0";
            } else {
              textStr = (100 * allGains / allAmount).toFixed(2);
              sumNum = textStr;
            }
          } else {
            sumNum = allGains;
            textStr = formatNum(allGains);
          }
        }

        chrome.browserAction.setBadgeText({
          text: textStr
        });
        let color = Realtime ?
          sumNum >= 0 ?
          "#F56C6C" :
          "#4eb61b" :
          "#4285f4";
        chrome.browserAction.setBadgeBackgroundColor({
          color: color
        });

      })
      .catch((error) => {

      });
  }



};


var startInterval = (RealtimeFundcode, type = 1) => {
  endInterval(Interval);
  let Realtime = isDuringDate();
  RealtimeFundcode = RealtimeFundcode;
  setBadge(RealtimeFundcode, Realtime, type);
  let time = 30 * 1000;
  if (type == 3) {
    time = 10 * 1000;
  }
  Interval = setInterval(() => {
    if (isDuringDate()) {
      setBadge(RealtimeFundcode, true, type);
    } else {
      chrome.browserAction.setBadgeBackgroundColor({
        color: "#4285f4"
      });
    }
  }, time);
};

var endInterval = () => {
  clearInterval(Interval);
  chrome.browserAction.setBadgeText({
    text: ""
  });
};

var runStart = (RealtimeFundcode, RealtimeIndcode) => {

  if (showBadge == 1 && BadgeContent == 1) {
    if (RealtimeFundcode) {
      startInterval(RealtimeFundcode);
    } else {
      endInterval();
    }
  } else if (showBadge == 1 && BadgeContent == 2) {
    startInterval(null, 2);
  } else if (showBadge == 1 && BadgeContent == 3) {
    if (RealtimeIndcode) {
      startInterval(RealtimeIndcode, 3);
    } else {
      endInterval();
    }

  } else {
    endInterval();
  }

};


var getData = () => {
  chrome.storage.sync.get(["holiday", "fundListM", "RealtimeFundcode", "RealtimeIndcode", "showBadge", "BadgeContent", "BadgeType", "userId"], res => {
    RealtimeFundcode = res.RealtimeFundcode ? res.RealtimeFundcode : null;
    RealtimeIndcode = res.RealtimeIndcode ? res.RealtimeIndcode : null;
    fundListM = res.fundListM ? res.fundListM : [];
    showBadge = res.showBadge ? res.showBadge : 1;
    BadgeContent = res.BadgeContent ? res.BadgeContent : 1;
    BadgeType = res.BadgeType ? res.BadgeType : 1;
    if (res.userId) {
      userId = res.userId;
    } else {
      userId = getGuid();
      chrome.storage.sync.set({
        userId: userId,
      });
    }
    if (res.holiday) {
      holiday = res.holiday;
      runStart(RealtimeFundcode, RealtimeIndcode);
    } else {
      getHoliday().then(res => {
        chrome.storage.sync.set({
            holiday: res.data
          },
          () => {
            holiday = res.data;
            runStart(RealtimeFundcode, RealtimeIndcode);
          }
        );
      }).catch(err => {
        chrome.storage.sync.set({
            holiday: {}
          },
          () => {
            holiday = {};
            runStart(RealtimeFundcode, RealtimeIndcode);
          }
        );
      });
    }
  });
}

getData();

chrome.contextMenus.create({
  title: "以独立窗口模式打开",
  contexts: ["browser_action"],
  onclick: () => {
    chrome.windows.create({
      url: chrome.runtime.getURL("popup/popup.html"),
      width: 700,
      height: 550,
      top: 200,
      type: "popup",
    }, (function (e) {
      chrome.windows.update(e.id, {
        focused: true
      })
    }))
  }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type == "DuringDate") {
    let DuringDate = isDuringDate();
    sendResponse({
      farewell: DuringDate
    });
  }
  if (request.type == "refresh") {
    getData();
  }
  if (request.type == "refreshHoliday") {
    holiday = request.data;
  }
  if (request.type == "refreshBadgeAllGains") {
    let allAmount = 0;
    let allGains = 0;
    let sumNum = 0;
    request.data.forEach((val) => {
      // popup 发来的字段是 fundcode/dwjz/gsz，兼容大写 FCODE/NAV/GSZ
      let code = val.fundcode || val.FCODE;
      let nav = val.dwjz != null ? val.dwjz : val.NAV;
      let gsz = val.gsz != null ? val.gsz : val.GSZ;
      let slt = fundListM.filter((item) => item.code == code);
      let num = slt[0] && slt[0].num ? slt[0].num : 0;
      allAmount += nav * num;
      let sum = gsz ? (gsz - nav) * num : 0;
      allGains += sum;
    });
    let textStr = null;
    if (BadgeType == 1) {
      if (allAmount == 0 || allGains == 0) {
        textStr = "0"
        sumNum = "0"
      } else {
        textStr = (100 * allGains / allAmount).toFixed(2);
        sumNum = textStr
      }

    } else {
      textStr = formatNum(allGains);
      sumNum = allGains;
    }

    chrome.browserAction.setBadgeText({
      text: textStr
    });
    let color = isDuringDate() ?
      sumNum >= 0 ?
      "#F56C6C" :
      "#4eb61b" :
      "#4285f4";
    chrome.browserAction.setBadgeBackgroundColor({
      color: color
    });
  }
  if (request.type == "endInterval") {
    endInterval();
  }
  if (request.type == "startInterval") {
    startInterval(request.id);
  }
  if (request.type == "refreshOption") {
    switch (request.data.type) {
      case "showBadge":
        showBadge = request.data.value;
        break;
      case "BadgeContent":
        BadgeContent = request.data.value;
        break;
      case "BadgeType":
        BadgeType = request.data.value;
        break;
    }
    getData();
  }
  if (request.type == "refreshBadge") {
    let textstr = null;
    let num = 0;
    if (BadgeType == 1) {
      num = request.data.gszzl;
      textstr = String(num);
    } else {
      num = request.data.gains;
      textstr = formatNum(request.data.gains);
    }
    chrome.browserAction.setBadgeText({
      text: textstr
    });
    let color = isDuringDate() ?
      num >= 0 ?
      "#F56C6C" :
      "#4eb61b" :
      "#4285f4";
    chrome.browserAction.setBadgeBackgroundColor({
      color: color
    });
  }
});