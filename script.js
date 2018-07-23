window.onload = function() {
  var game = {
    score: 0,
    blocks: [],
    rows: 4,
    cols: 4,
    maxSnapshots: 1,
  };

  var keys = {
    RIGHT: 39,
    DOWN: 40,
    LEFT: 37,
    TOP: 38,
    LAST_SNAPSHOT: 32,
  };

  var processing = false;
  var snapshots = [];
  var $screen;
  var $score;
  var $blocks;

  function handleUserInput (key) {
    if (processing) {
      return;
    }

    switch (key) {
      case keys.RIGHT:
        handleMove([0, 1]);
        break;
      case keys.LEFT:
        handleMove([0, -1]);
        break;
      case keys.DOWN:
        handleMove([1, 0]);
        break;
      case keys.TOP:
        handleMove([-1, 0]);
        break;
      case keys.LAST_SNAPSHOT:
        loadLastSnapshot();
        break;
    }
  }

  function create () {
    $screen = document.getElementById('screen');
    processing = false;
    snapshots = [];

    game.score = 0;
    game.blocks = [];

    for (var pos = 0; pos < game.rows * game.cols; pos++) {
      game.blocks.push(0);
    }

    addNewBlock(2);
    addNewBlock(2);
    saveSnapshot();

    var blocksTable = game.blocks.reduce((html, value, pos) => {
      if (pos % game.cols === 0) {
        html += '<tr>';
      }

      html += `<td class="block" data-value="${value}">${value}</td>`;

      if (pos % game.cols === game.cols - 1) {
        html += '</tr>';
      }

      return html;
    }, '');

    $screen.innerHTML = `
      <div class="score">Score: <span id="score">0</span></div>
      <div class="table">
        <table>
          <tbody>
            ${blocksTable}
          </tbody>
        </table>
      </div>
    `;

    $score = document.getElementById('score');
    $blocks = document.getElementsByClassName('block');
    window.addEventListener('keydown', (event) => handleUserInput(event.keyCode), false);
  }

  function render (callback) {
    $score.innerHTML = game.score;

    for (var pos = 0; pos < $blocks.length; pos++) {
      $blocks[pos].innerHTML = game.blocks[pos];
      $blocks[pos].setAttribute('data-value', game.blocks[pos]);
    }

    if (callback != null) {
      setTimeout(callback, 20);
    }
  }

  function handleMove (direction) {
    processing = true;
    var didChange = moveBlocks(direction)

    if (didChange) {
      addNewBlock();
      saveSnapshot();
    }

    render(() => {
      checkGameOver();
      processing = false;
    });
  }

  function checkGameOver() {
    if (!canMoveBlocks([0, 1])
     && !canMoveBlocks([0, -1])
     && !canMoveBlocks([1, 0])
     && !canMoveBlocks([-1, 0])) {
      gameOver();
    }
  }

  function canMoveBlocks (direction) {
    var canMove = false;
    var lastValue;

    forEachBlock(direction, (value, pos, firstOfLine) => {
      if (firstOfLine) {
        lastValue = 0;
      }

      if (value === 0 || value === lastValue) {
        canMove = true;
        return false;
      } else {
        lastValue = value;
      }
    });

    return canMove;
  }

  function moveBlocks (direction) {
    var didChange = false;
    var lastPosWithValue;
    var lastValue;

    forEachBlock(direction, (value, pos, firstOfLine, getNextPos) => {
      if (firstOfLine) {
        // first of line, just set the position
        lastPosWithValue = pos;
        lastValue = value;
        return;
      }

      if (value > 0) {
        if (value === lastValue) {
          // sum equal values
          game.blocks[lastPosWithValue] *= 2;
          game.score += game.blocks[lastPosWithValue];

          game.blocks[pos] = 0;
          lastPosWithValue = getNextPos(lastPosWithValue);
          lastValue = 0;
          didChange = true;
        } else {
          if (lastValue !== 0) {
            lastPosWithValue = getNextPos(lastPosWithValue);
            lastValue = value;
          }

          if (lastPosWithValue !== pos) {
            // move block
            game.blocks[pos] = 0;
            game.blocks[lastPosWithValue] = value;
            lastValue = value;
            didChange = true;
          }
        }
      }
    });

    return didChange;
  }

  function forEachBlock (direction, handler) {
    if (direction[1] === 1) { // RIGHT
      var pos = game.blocks.length - 1;
      var getNextPos = (pos) => pos - 1;
      var checkIsFirstOfLine = (pos) => pos % game.cols === game.cols - 1;
    } else if (direction[1] === -1) { // LEFT
      var pos = 0;
      var getNextPos = (pos) => pos + 1;
      var checkIsFirstOfLine = (pos) => pos % game.cols === 0;
    } else if (direction[0] === 1) { // DOWN
      var pos = game.blocks.length - 1;
      var getNextPos = (pos) => pos >= game.cols ? pos - game.cols : game.blocks.length - game.cols + pos - 1;
      var checkIsFirstOfLine = (pos) => pos >= game.blocks.length - game.cols;
    } else if (direction[0] === -1) { // UP
      var pos = 0;
      var getNextPos = (pos) => pos < game.blocks.length - game.cols ? pos + game.cols : pos + game.cols - game.blocks.length + 1;
      var checkIsFirstOfLine = (pos) => pos < game.cols;
    } else {
      return;
    }

    for (var i = 0; i < game.blocks.length; i++) {
      var firstOfLine = checkIsFirstOfLine(pos);
      var res = handler(game.blocks[pos], pos, firstOfLine, getNextPos);
      if (res === false) { break; }
      pos = getNextPos(pos);
    }
  }

  function addNewBlock (chosenValue) {
    var availableBlocks = [];

    game.blocks.forEach((value, pos) => {
      if (value === 0) {
        availableBlocks.push(pos);
      }
    });

    var chosenBlock = availableBlocks[Math.floor(Math.random() * availableBlocks.length)];
    var chosenValue = chosenValue > 0 ? chosenValue : Math.random() > 0.85 ? 4 : 2;
    game.blocks[chosenBlock] = chosenValue;
  }

  function saveSnapshot () {
    snapshots.push({
      score: game.score,
      blocks: game.blocks.slice(),
    });

    if (snapshots.length > game.maxSnapshots + 1) {
      snapshots = snapshots.slice(snapshots.length - game.maxSnapshots - 1);
    }
  }

  function loadLastSnapshot () {
    // ignore last (current) snapshot
    var pos = snapshots.length - 2;

    if (snapshots[pos] != null) {
      game.score = snapshots[pos].score;
      game.blocks = snapshots[pos].blocks.slice();
      snapshots = snapshots.slice(0, pos + 1);
      render();
    }
  }

  function gameOver () {
    alert('Game over!');
  }

  create();
  render();
};
