module.exports = function (callback) {
  setTimeout(function () {
    callback(undefined, {value: 'dynamic'});
  }, 20);
};
