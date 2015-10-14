var assert = require('assert');

describe('index', function() {
  describe('#loadlevel(definition)', function () {
    it('should not error', function () {
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
    });
  });
});