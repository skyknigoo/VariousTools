/* -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* globals InputMethods, KeyEvent */
'use strict';

requireApp('keyboard/test/unit/setup_engine.js');
requireApp('keyboard/js/imes/jspinyin/jspinyin.js');

suite('jspinyin', function() {

  var NUMBER_OF_CANDIDATES_PER_ROW = 8;

  var jspinyin;
  var firstCandidate;
  var firstPredict;
  var dummyFunction = function() {};
  var glue = {
    path: '/js/imes/jspinyin',
    sendCandidates: dummyFunction,
    setComposition: dummyFunction,
    endComposition: dummyFunction,
    sendKey: dummyFunction,
    sendString: dummyFunction,
    setLayoutPage: dummyFunction,
    setUpperCase: dummyFunction,
    resetUpperCase: dummyFunction,
    replaceSurroundingText: dummyFunction,
    getNumberOfCandidatesPerRow: function() {
      return NUMBER_OF_CANDIDATES_PER_ROW;
    }
  };
  var fakeUserDict = [240, 222, 188, 10, 0, 2, 239, 0, 176, 1, 11, 140, 122,
                      102, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 252, 0, 0, 0, 0, 0, 0,
                      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
                      10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0,
                      0];

  var fakeUserDictNew = [240, 222, 188, 10, 0, 2, 239, 0, 176, 1, 11, 140, 122,
                         102, 0, 2, 239, 0, 176, 1, 208, 103, 234, 83, 10];

  function mockIndexedDB(args) {
    var receivedData;
    var request = {};
    var transRequest = {};
    var fakeDB = {
      objectStoreNames: [1, 2],
      createObjectStore: dummyFunction,
      deleteObjectStore: dummyFunction,
      transaction: sinon.stub(),
      objectStore: sinon.stub(),
      get: sinon.stub(),
      put: dummyFunction,
      close: dummyFunction
    };
    var evt = {
      target: {
        result: fakeDB
      }
    };
    var evtError = {
      target: {
        errorCode: 123,
        result: {
          name: 'test'
        }
      }
    };

    sinon.stub(window.indexedDB, 'open');
    window.indexedDB.open.returns(request);

    fakeDB.transaction.returns(fakeDB);
    fakeDB.objectStore.returns(fakeDB);
    fakeDB.get.returns(transRequest);

    sinon.stub(fakeDB, 'put', function(data) {
      receivedData = data;
      return transRequest;
    });

    if (args.testing) {
      args.testing();
    }

    function indexedDBActions() {
      if (!args.ignoreUndefinedHandler) {
        assert.isFunction(request.onupgradeneeded);
        assert.isFunction(request.onsuccess);
      }

      if (args.openDBFailed) {
        if (request.onerror) {
          request.onerror(evtError);
        }
        if (args.callback) {
          args.callback(receivedData);
        }
        return;
      }

      if (request.onupgradeneeded) {
        request.onupgradeneeded(evt);
      }

      if (request.onsuccess) {
        request.onsuccess(evt);
      }

      if (!args.ignoreUndefinedHandler) {
        assert.isFunction(transRequest.onsuccess);
      }

      if (args.transactionFailed) {
        if (transRequest.onerror) {
          transRequest.onerror(evtError);
        }
        if (args.callback) {
          args.callback(receivedData);
        }
        return;
      }

      if (transRequest.onsuccess) {
        transRequest.onsuccess({
          target: {
            result: {
              content: fakeUserDict
            }
          }
        });

        if (args.callback) {
          args.callback(receivedData);
        }
      }
    }

    if (args.waitForHandler) {
      var indexedDBActionsTimer = setInterval(function() {
        if (request.onsuccess) {
          indexedDBActions();
          clearInterval(indexedDBActionsTimer);
        }
      }, 100);
    } else {
      indexedDBActions();
    }
  }

  suiteTeardown(function() {
    jspinyin.uninit();
    assert.isNull(jspinyin._uninitTimer);

    delete InputMethods.jspinyin;
  });

  teardown(function() {
    if (window.indexedDB.open.restore) {
      window.indexedDB.open.restore();
    }
  });

  test('load', function() {
    assert.isDefined(InputMethods.jspinyin);
    jspinyin = InputMethods.jspinyin;
  });

  test('init', function() {
    jspinyin.init(glue);
    assert.equal(jspinyin._glue.path, glue.path);
  });

  test('do something before activate', function(done) {
    jspinyin.click(KeyEvent.DOM_VK_RETURN);
    jspinyin.select('', 0);
    jspinyin.getMoreCandidates(
      0,
      NUMBER_OF_CANDIDATES_PER_ROW,
      function(list) {
        done(function() {
          assert.isNull(list);
        });
      }
    );
  });

  test('activate', function(done) {
    this.sinon.stub(jspinyin, '_start', function() {
      done(function() {
        assert.equal(jspinyin._keypressQueue[0], KeyEvent.DOM_VK_RETURN);
        assert.isNull(jspinyin._uninitTimer);
        jspinyin._resetKeypressQueue();
      });
    });

    mockIndexedDB({
      testing: function() {
        jspinyin._uninitTimer = setTimeout(function() {
          throw 'Should not call this function.';
        }, 0);
        jspinyin.activate('zh-Hans', { type: 'text' }, {});
      }
    });
  });

  test('activate twice', function() {
    this.sinon.stub(jspinyin, '_start');

    mockIndexedDB({
      ignoreUndefinedHandler: true,
      testing: function() {
        jspinyin._uninitTimer = setTimeout(function() {
          throw 'Should not call this function.';
        }, 0);

        jspinyin.activate('zh-Hans', { type: 'textarea' }, {});
      }
    });
  });

  test('click \'z\'', function(done) {
    var len;

    this.sinon.stub(glue, 'sendCandidates', function(list) {
      firstCandidate = list[0];
      len = list.length;
    });

    this.sinon.stub(glue, 'setComposition', function(symbols, cursor) {
      if (glue.sendCandidates.called) {
        done(function() {
          assert.equal(symbols, 'z');
          assert.deepEqual(firstCandidate, ['???', 0]);
          assert.equal(len, NUMBER_OF_CANDIDATES_PER_ROW + 1);
        });
      }
    });

    jspinyin.click('z'.charCodeAt(0));
  });

  test('get more candidates', function(done) {
    jspinyin.getMoreCandidates(
      NUMBER_OF_CANDIDATES_PER_ROW,
      NUMBER_OF_CANDIDATES_PER_ROW * 12,
      function(list) {
        done(function() {
          assert.deepEqual(list[0], ['???', 8]);
          assert.deepEqual(list[list.length - 1], ['???', 103]);
          assert.equal(list.length, NUMBER_OF_CANDIDATES_PER_ROW * 12);
        });
      }
    );
  });

  test('select first candidate and get predicts', function(done) {
    var endCompositionString;

    this.sinon.stub(glue, 'endComposition', function(text) {
      if (text) {
        endCompositionString = text;
      }
    });

    this.sinon.stub(glue, 'sendCandidates', function(list) {
      firstPredict = list[0];
      done(function() {
        assert.equal(endCompositionString, firstCandidate[0]);
        assert.deepEqual(firstPredict, ['???', 0]);
        assert.equal(list.length, NUMBER_OF_CANDIDATES_PER_ROW + 1);
      });
    });

    jspinyin.select(firstCandidate[0], firstCandidate[1]);
  });

  test('get more predicts', function(done) {
    jspinyin.getMoreCandidates(
      NUMBER_OF_CANDIDATES_PER_ROW,
      NUMBER_OF_CANDIDATES_PER_ROW * 12,
      function(list) {
        done(function() {
          assert.deepEqual(list[0], ['???', 8]);
          assert.deepEqual(list[list.length - 1], ['?????????', 97]);
          assert.equal(list.length, 90);
        });
      }
    );
  });

  test('select first predict', function(done) {
    this.sinon.stub(jspinyin, '_start');
    this.sinon.stub(glue, 'endComposition', function(text) {
      done(function() {
        assert.equal(text, firstPredict[0]);
      });
    });

    jspinyin.select(firstPredict[0], firstPredict[1]);
  });

  test('empty', function(done) {
    this.sinon.spy(glue, 'endComposition');
    this.sinon.stub(glue, 'sendCandidates', function(list) {
      if (glue.endComposition.called) {
        done(function() {
          assert.isTrue(glue.endComposition.calledWith(undefined));
          assert.equal(list.length, 0);
        });
      }
    });

    jspinyin.empty();
  });

  test('input the phrase in userdict from indexedDB', function(done) {
    jspinyin.click('m'.charCodeAt(0));
    jspinyin.click('o'.charCodeAt(0));
    jspinyin.click('u'.charCodeAt(0));
    jspinyin.click('z'.charCodeAt(0));
    jspinyin.click('h'.charCodeAt(0));
    jspinyin.click('i'.charCodeAt(0));
    jspinyin.click(KeyEvent.DOM_VK_RETURN);

    this.sinon.stub(glue, 'endComposition', function(text) {
      if (!text) {
        done(function() {
          assert.isTrue(glue.endComposition.calledWith('??????'));
        });
      }
    });
  });

  test('create new phrase into userdict', function(done) {
    this.sinon.stub(glue, 'endComposition', function(text) {
      if (!text) {
        done(function() {
          assert.isTrue(glue.endComposition.calledWith('??????'));
        });
      }
    });

    this.sinon.stub(glue, 'setComposition', function(symbol, cursor) {
      if (symbol == 'mou zhi') {
        jspinyin.select('???', 1);
      } else if (symbol == '???zhi') {
        jspinyin.select('???', 1);
      }
    });

    jspinyin.click('m'.charCodeAt(0));
    jspinyin.click('o'.charCodeAt(0));
    jspinyin.click('u'.charCodeAt(0));
    jspinyin.click('z'.charCodeAt(0));
    jspinyin.click('h'.charCodeAt(0));
    jspinyin.click('i'.charCodeAt(0));
  });

  test('input the phrase in userdict that we just created', function(done) {
    var isOk = false;

    jspinyin.click('m'.charCodeAt(0));
    jspinyin.click('o'.charCodeAt(0));
    jspinyin.click('u'.charCodeAt(0));
    jspinyin.click('z'.charCodeAt(0));
    jspinyin.click('h'.charCodeAt(0));
    jspinyin.click('i'.charCodeAt(0));
    jspinyin.click(KeyEvent.DOM_VK_RETURN);

    this.sinon.stub(glue, 'sendCandidates', function(list) {
      if (list[1] && list[1][0] == '??????') {
        isOk = true;
      }
    });

    this.sinon.stub(glue, 'endComposition', function(text) {
      if (!text) {
        done(function() {
          assert.isTrue(isOk);
        });
      }
    });
  });

  test('click backspace to clear pendingSymbols', function(done) {
    this.sinon.stub(glue, 'setComposition');
    this.sinon.stub(glue, 'endComposition');

    this.sinon.stub(glue, 'sendKey', function(keyCode) {
      done(function() {
        assert.equal(keyCode, KeyEvent.DOM_VK_BACK_SPACE);
        assert.isTrue(glue.endComposition.called);
      });
    });

    jspinyin.click('z'.charCodeAt(0));

    // "A" means "'" for pinyin composition
    jspinyin.click('A'.charCodeAt(0));
    jspinyin.click(KeyEvent.DOM_VK_BACK_SPACE);
    jspinyin.click(KeyEvent.DOM_VK_BACK_SPACE);
    jspinyin.click(KeyEvent.DOM_VK_BACK_SPACE);
  });

  test('click a symbol', function(done) {
    this.sinon.stub(glue, 'sendKey', function(keyCode) {
      done(function() {
        assert.equal(keyCode, '\''.charCodeAt(0));
      });
    });
    jspinyin.click('\''.charCodeAt(0));
  });

  test('deactivate', function(done) {
    this.sinon.spy(jspinyin, 'empty');

    mockIndexedDB({
      waitForHandler: true,
      callback: function(data) {
        done(function() {
          assert.isTrue(jspinyin.empty.calledOnce);
          assert.deepEqual(data.content.slice(0, fakeUserDictNew.length),
                           fakeUserDictNew);
        });
      },
      testing: function() {
        jspinyin.deactivate();
      }
    });
  });

  test('uninit', function() {
    this.sinon.spy(jspinyin, 'empty');
    jspinyin.uninit();
    assert.isNull(jspinyin._uninitTimer);
    assert.isTrue(jspinyin.empty.calledOnce);
  });

  test('activate (open indexedDB failed)', function(done) {
    mockIndexedDB({
      openDBFailed: true,
      ignoreUndefinedHandler: true,
      callback: function() {
        done();
      },
      testing: function() {
        jspinyin.activate('zh-Hans', { type: 'text' }, {});
      }
    });
  });

  test('activate (load indexedDB failed)', function(done) {
    mockIndexedDB({
      transactionFailed: true,
      ignoreUndefinedHandler: true,
      callback: function() {
        done();
      },
      testing: function() {
        jspinyin.activate('zh-Hans', { type: 'text' }, {});
      }
    });
  });

  // Bug 1146260
  test.skip('deactivate (save indexedDB failed)', function(done) {
    this.sinon.stub(jspinyin, '_start', function() {
      window.indexedDB.open.restore();
      setTimeout(function() {
        mockIndexedDB({
          waitForHandler: true,
          transactionFailed: true,
          ignoreUndefinedHandler: true,
          callback: function() {
            done();
          },
          testing: function() {
            jspinyin.deactivate();
          }
        });
      }, 500);
    });

    mockIndexedDB({
      testing: function() {
        jspinyin.activate('zh-Hans', { type: 'text' }, {});
      }
    });
  });
});
