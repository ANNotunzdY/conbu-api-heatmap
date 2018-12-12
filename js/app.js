var config = {
  ap_config: "conf/ap_setting/conf.json",
  global_config: "config.json",
  api_head: "http://api.conbu.net/v1/associations/",
};
var global_config = {};

var heatmapInstance;
var _dataPoint = {
  radius: 130,
//  opacity: 1,
  maxOpacity: .9,
  minOpacity: .3,
  blur: 1,
  gradient: {
    '.3': 'blue',
    '.5': 'red',
    '.85': 'white'
  }
};

var apSetting;

function getDataPoints(group) {
  var dataPoints = [];
  var p_arr = [];
  Object.keys(group).forEach(function (key) {
    p_arr.push(getAssociations(key, group[key]));
  });
  Promise.all(p_arr).then(vals => {
    vals.forEach(cval => {dataPoints.push(cval); }) })
  .catch(reason => {
    console.log("API error, failed on load: " + reason.message);
    return;
  });
  return dataPoints;
}

function getAssociations(place, group) {
  fetch(config.api_head + place + "/both", {cache: "no-cache", method: "GET"})
  .then((response) => {
    if (response.ok) { return response.json(); }
    throw('API access error for ' + place + ' : ' + response.status);
  }).then(data => {
    var dp = {};
    Object.assign(dp, _dataPoint);
    dp.x = group.coordinates.x;
    dp.y = group.coordinates.y;
    dp.key = key;
    dp.rowValue = data.associations;
    dp.value = associations * (1000 / group.max);
    return dp;
  });
}

function updateTime() {
  var date = new Date();
  var clock = date.getFullYear() + "-"
      + ("0" + (date.getMonth() + 1)).slice(-2) + "-"
      + ("0" + date.getDate()).slice(-2) + " "
      + ("0" + date.getHours()).slice(-2) + ":"
      + ("0" + date.getMinutes()).slice(-2) + ":"
      + ("0" + date.getSeconds()).slice(-2);
  document.getElementById("time").innerHTML = clock;
}

function start() {

  var dataPoints = [];
  Object.keys(apSetting).forEach(function (key) {
    dataPoints = dataPoints.concat(getDataPoints(apSetting[key]));
  });
  var data = {
    max: 1000,
    min: 0,
    data: dataPoints
  };
  heatmapInstance.setData(data);

  // add new
  var tipCanvas = document.getElementById("tip");
  var tipCtx = tipCanvas.getContext("2d");

  var c = document.getElementsByClassName("heatmap-canvas")[0];
  var ctx = c.getContext("2d");
  Object.keys(dataPoints).forEach(function (i) {
    var dataPoint = dataPoints[i];
    ctx.beginPath();
    ctx.arc(dataPoint.x, dataPoint.y, 5, 0, 2 * Math.PI);
    ctx.strokeStyle = "#D7000F";
    ctx.stroke();
  });
  c.onmousemove = function(e) {
    var skip = skip || 0;
    if (skip++ % 3) return;
    var hit = false;
    var self = this;
    Object.keys(dataPoints).forEach(function (i) {

      var dataPoint = dataPoints[i];
      ctx.beginPath();
      ctx.arc(dataPoint.x, dataPoint.y, 5, 0, 2 * Math.PI);

      var rect = self.getBoundingClientRect(),
          x = e.clientX - rect.left,
          y = e.clientY - rect.top;

      if(ctx.isPointInPath(x, y)) {
        tipCanvas.style.left = (x) + "px";
        tipCanvas.style.top = (y - 20) + "px";
        tipCtx.clearRect(0, 0, tipCanvas.width, tipCanvas.height);
        tipCtx.font = "12px 'ＭＳ Ｐゴシック'";
        tipCtx.fillStyle = "black";
        tipCtx.fillText(dataPoint.key + ": {\"assoc\"," + dataPoint.rowValue + "}", 5, 10);
        hit = true;
      }
    });
    if (!hit) { tipCanvas.style.left = "-200px"; }
  }

  updateTime();

  setTimeout(start, 10000);
}

function ModifyEvent() {
  // title
  var re = /\{EVENTNAME\}/;
  var tstr;
  tstr = document.title;
  document.title = tstr.replace(re, global_config.event);
  tstr = document.getElementById('h_title').innerText;
  document.getElementById('h_title').innerText = 
    tstr.replace(re, global_config.event);

  // image
  var bg_img = document.getElementById('back_img');
  bg_img.src = global_config.image;
  bg_img.alt = global_config.image;
}

window.addEventListener("load", function(event) {
  Promise.all([
    fetch(config.ap_config, {cache: "no-cache", method: "GET"})
    .then((response) => {
      if (response.ok) { return response.json(); }
      throw('ap_config load error with ' + response.status);
    }).then(data => { apSetting = data }),
    fetch(config.global_config, {cache: "no-cache", method: "GET"})
    .then((response) => {
      if (response.ok) { return response.json(); }
      throw('global_config load error with ' + response.status);
    }).then(data => { global_config = data }),
  ]).then(vals => {
    ModifyEvent();
    heatmapInstance = h337.create({
      container: document.getElementById('top-view'),
    });
    start();
  }).catch(reason => {
    console.log("API error, failed on initial load: " + reason.message);
    return;
  });
});

