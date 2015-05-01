module.exports = function (callback) {
  process.nextTick(function () {
    callback(undefined, {value: 'dynamic'});
  });
};
