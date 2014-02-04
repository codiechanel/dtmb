var DEBUG = false;
var SPEED = 160;
var GRAVITY = 20;
var FLAP = 400;
var SPAWN_RATE = 1 / 1.2;
var OPENING = 140;


WebFontConfig = {
    google: { families: [ 'Press+Start+2P::latin' ] },
    active: main
};
(function() {
    var wf = document.createElement('script');
    wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
      '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
    wf.type = 'text/javascript';
    wf.async = 'true';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);
})(); 


function main() {

var state = {
    preload: preload,
    create: create,
    update: update,
    render: render
};

var game = new Phaser.Game(
    window.innerWidth,
    window.innerHeight,
    Phaser.CANVAS,
    'screen',
    state,
    false,
    false
);

function preload() {
    var assets = {
        spritesheet: {
            birdie: ['assets/birdie.png', 24, 24]
        },
        image: {
            finger: ['assets/finger.png']
        }
    };
    Object.keys(assets).forEach(function(type) {
        Object.keys(assets[type]).forEach(function(id) {
            game.load[type].apply(game.load, [id].concat(assets[type][id]));
        });
    });
}

var gameStarted,
    gameOver,
    score,
    bg,
    birdie,
    fingers,
    scoreText,
    instText,
    gameOverText,
    fingersTimer;

function create() {
    // Draw bg
    bg = game.add.graphics(0, 0);
    bg.beginFill(0xFFFF99, 1);
    bg.drawRect(0, 0, game.world.width, game.world.height);
    bg.endFill();
    // Add birdie
    birdie = game.add.sprite(0, 0, 'birdie');
    birdie.anchor.setTo(0.5, 0.5);
    birdie.body.collideWorldBounds = true;
    birdie.animations.add('fly', [0, 1, 2, 3], 10, true);
    // Add fingers
    fingers = game.add.group();
    // Add invisible thingies
    invs = game.add.group();
    // Add score text
    scoreText = game.add.text(
        game.world.width / 2,
        120,
        "",
        {
            font: '16px "Press Start 2P"',
            fill: '#fff',
            stroke: '#430',
            strokeThickness: 4,
            align: 'center'
        }
    );
    scoreText.anchor.setTo(0.5, 0.5);
    // Add instructions text
    instText = game.add.text(
        game.world.width / 2,
        game.world.height - 160,
        "",
        {
            font: '8px "Press Start 2P"',
            fill: '#fff',
            stroke: '#430',
            strokeThickness: 4,
            align: 'center'
        }
    );
    instText.anchor.setTo(0.5, 0.5);
    // Add game over text
    gameOverText = game.add.text(
        game.world.width / 2,
        game.world.height / 2,
        "",
        {
            font: '16px "Press Start 2P"',
            fill: '#fff',
            stroke: '#430',
            strokeThickness: 4,
            align: 'center'
        }
    );
    gameOverText.anchor.setTo(0.5, 0.5);
    gameOverText.scale.setTo(2, 2);
    // Add controls
    game.input.onDown.add(onDown);
    // RESET!
    reset();
}

function reset() {
    gameStarted = false;
    gameOver = false;
    score = 0;
    scoreText.setText("DON'T\nTOUCH\nMY\nBIRDIE");
    instText.setText("TAP TO START");
    gameOverText.renderable = false;
    birdie.reset(game.world.width / 3, game.world.height / 2);
    birdie.scale.setTo(2, 2);
    birdie.animations.play('fly');
    birdie.angle = 0;
    birdie.body.gravity.y = 0;
    birdie.anchor.x = 0.5;
    fingers.removeAll();
    invs.removeAll();
}

function onDown() {
    if (!gameStarted) {
        birdie.body.gravity.y = GRAVITY;
        // SPAWN FINGERS!
        fingersTimer = new Phaser.Timer(game);
        fingersTimer.onEvent.add(spawnFingers);
        fingersTimer.start();
        fingersTimer.add(3);
        // Show score
        scoreText.setText(score);
        instText.renderable = false;
        // START!
        gameStarted = true;
    }
    if (gameOver) {
        reset();
    } else {
        birdie.body.velocity.y = -FLAP;
    }
}

function spawnFinger(fingerY, flipped) {
    var e = 40;
    var o = OPENING + e;
    var finger = fingers.create(
        game.width,
        fingerY + (flipped ? -o : o) / 2,
        'finger'
    );
    finger.allowGravity = false;

    // Flip finger! *GASP*
    finger.scale.setTo(2, flipped ? -2 : 2);
    finger.body.offset.y = flipped ? -finger.body.height * 2 : 0;

    // Creepy action
    if (flipped) {
        finger.body.velocity.y = e;
        finger.body.acceleration.y = -e;
    }  else {
        finger.body.velocity.y = -e;
        finger.body.acceleration.y = e;
    }

    // Move to the left
    finger.body.velocity.x = -SPEED;

    return finger;
}

function spawnFingers() {
    fingersTimer.stop();

    var fingerY = (game.height / 2) + (Math.random() > 0.5 ? -1 : 1) * Math.random() * game.height / 6;
    // Bottom finger
    var botFinger = spawnFinger(fingerY);
    // Top finger (flipped)
    var topFinger = spawnFinger(fingerY, true);

    // Add invisible thingy
    var inv = invs.create(
        topFinger.x + topFinger.width,
        fingerY - OPENING / 2
    );
    inv.allowGravity = false;
    inv.width = 2;
    inv.height = OPENING;
    inv.body.velocity.x = -SPEED;

    // Make sure birdie is the star
    birdie.bringToTop();

    fingersTimer.start();
    fingersTimer.add(1 / SPAWN_RATE);
}

function addScore(_, inv) {
    invs.remove(inv);
    score += 1;
    scoreText.setText(score);
}

function setGameOver() {
    gameOver = true;
    instText.setText("TAP TO TRY AGAIN");
    instText.renderable = true;
    gameOverText.setText("GAME OVER");
    gameOverText.renderable = true;
    // Stop all fingers
    fingers.forEachAlive(function(finger) {
        finger.body.velocity.x = 0;
    });
    invs.forEach(function(inv) {
        inv.body.velocity.x = 0;
    });
    // Stop spawning fingers
    fingersTimer.stop();
}

function update() {
    if (gameStarted) {
        // Make birdie dive
        var dvy = FLAP + birdie.body.velocity.y;
        birdie.angle = (90 * dvy / FLAP) - 180;
        if (birdie.angle < -15) {
            birdie.angle = -15;
        }
        if (
            gameOver ||
            birdie.angle > 90 ||
            birdie.angle < -90
        ) {
            birdie.angle = 90;
            birdie.animations.stop();
            birdie.frame = 3;
        } else {
            birdie.animations.play('fly');
        }
        // Birdie is DEAD!
        if (gameOver) {
            if (birdie.scale.x < 4) {
                birdie.scale.setTo(
                    birdie.scale.x * 1.2,
                    birdie.scale.y * 1.2
                );
            }
            // Shake game over text
            gameOverText.angle = Math.random() * 5 * Math.cos(game.time.now / 100);
        } else {
            // Check game over
            game.physics.overlap(birdie, fingers, setGameOver);
            if (!gameOver && birdie.body.bottom >= game.world.bounds.bottom) {
                // FIXME: Add a floor and check collision there
                setGameOver();
            }
            // Add score
            game.physics.overlap(birdie, invs, addScore);
        }
        // Remove offscreen fingers
        fingers.forEachAlive(function(finger) {
            if (finger.x + finger.width < game.world.bounds.left) {
                finger.kill();
            }
        });
        // Shake score text
        scoreText.scale.setTo(
            2 + 0.1 * Math.cos(game.time.now / 100),
            2 + 0.1 * Math.sin(game.time.now / 100)
        );
        // Update finger timer
        fingersTimer.update();
    } else {
        birdie.y = (game.world.height / 2) + 8 * Math.cos(game.time.now / 200);
    }
    if (!gameStarted || gameOver) {
        // Shake instructions text
        instText.scale.setTo(
            2 + 0.1 * Math.sin(game.time.now / 100),
            2 + 0.1 * Math.cos(game.time.now / 100)
        );
    }
}

function render() {
    if (DEBUG) {
        game.debug.renderSpriteBody(birdie);
        fingers.forEachAlive(function(finger) {
            game.debug.renderSpriteBody(finger);
        });
        invs.forEach(function(inv) {
            game.debug.renderSpriteBody(inv);
        });
    }
}

};
