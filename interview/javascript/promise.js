/**
 * 1. 多个异步调用
 * 1. 1通过回调方式来进行多个异步调用
 */
var requestApis = {
  wangyi: function getWangyi(callback) {
    return sendRequestAndCallback(
      'https://api.66mz8.com/api/music.163.php',
      jsonParse.bind(null, callback)
    );
  },
  someMusic: function getSomeWords(callback) {
    return sendRequestAndCallback(
      'https://api.66mz8.com/api/rand.music.163.php',
      jsonParse.bind(null, callback)
    );
  },
  hello: function getHello(callback) {
    return sendRequestAndCallback(
      'http://localhost:3000/api/hello',
      jsonParse.bind(null, callback)
    );
  },
};

function allRequest(requests, callback, result) {
  if (requests.length === 0) {
    return callback(null, result);
  }

  var currentReq = requests.shift();

  currentReq(function (error, res) {
    if (error) {
      callback(error, res);
    } else {
      result.push(res);
      allRequest(requests, callback, result);
    }
  });
}

function main(callback) {
  allRequest(
    [requestApis.wangyi, requestApis.someMusic, requestApis.hello],
    callback,
    []
  );
}

main(function (error, result) {
  if (error) {
    return console.error(error);
  }
  console.log(result, 'last results');
});

function sendRequestAndCallback(url, callback) {
  var req = new XMLHttpRequest();

  req.open('GET', url, true); // true 表示异步

  req.onreadystatechange = function () {
    if (req.readyState === 4) {
      // 请求已完成
      if (req.status === 200) {
        callback(null, req.responseText);
      } else {
        callback(new Error(req.statusText), req.response);
      }
    } else {
      // 请求未完成
    }
  };

  req.onerror = function () {
    callback(new Error(req.statusText));
  };

  req.send();
}

function jsonParse(callback, error, res) {
  if (error) {
    calblack(error, res);
  } else {
    try {
      var result = JSON.parse(res);
      callback(null, result);
    } catch (error) {
      callback(error, res);
    }
  }
}
