var videos = {
    respack : "./respacks/thunk.zip",
    triggers : [
        {
        anim : "thunk1",
        sound : "thunk1",
        trigger : "o",
        beatFrame : 10,
        fps : 24,
        align : "left"
        },
        {
        anim : "thunk2",
        sound : "thunk2",
        trigger : "x",
        beatFrame : 6,
        fps : 24,
        align : "right"
        }
    ]
};

function Thunk(core) {
    this.core = core;
    
    this.width = 0;
    this.height = 0;
    
    // Contains objects of {startTime, endTime, lastFrame, imageArray, fps, x, y, w, h}
    this.anims = [];
    
    this.canvas = document.createElement("canvas").getContext("2d");
    
    core.addEventListener("loaded", this.init.bind(this));
    
    this.loaded = false;
    this.respack = new Respack();
    this.respack.loadFromURL(videos.respack).then(function() {
        this.loaded = true;
        
        // Run some useful pre-calcs
        videos.triggers.forEach(function(anim) {
            anim.images = null;
            this.respack.images.forEach(function(image) {
                if(image.name == anim.anim) {
                    anim.images = image.bitmaps;
                }
            });
            if(anim.images === null) {
                throw "No image found for animation name " + anim.anim;
            }
            anim.length = (1/anim.fps) * anim.images.length;
            anim.beatTime = (1/anim.fps) * anim.beatFrame;
            anim.width = anim.images[0].width;
            anim.height = anim.images[0].height;
            anim.offset = -anim.height; // we move it down the page on each trigger
            anim.direction = 1;
        }, this);
    }.bind(this));
}

Thunk.prototype.init = function() {
    window.addEventListener("resize", this.resize.bind(this));
    this.resize();
    
    document.body.appendChild(this.canvas.canvas);
    
    core.addEventListener("frame", this.onFrame.bind(this));
    core.addEventListener("songstarted", this.newSong.bind(this));
}

Thunk.prototype.onFrame = function() {
    if(!this.loaded) {
        return;
    }
    var now = this.core.soundManager.currentTime;
    // Remove and clear finished anims
    var redraw = false;
    for(var i = 0; i < this.anims.length; i++) {
        var anim = this.anims[i];
        if(now > anim.endTime) {
            this.canvas.clearRect(anim.x, anim.y, anim.w, anim.h);
            this.anims.splice(i--, 1);
            redraw = true;
        }
    }
    // Schedule new animations + sound
    videos.triggers.forEach(function(anim) {
        // Because we need to start before the actual beat
        var offsetNow = now + anim.beatTime;
        for(var beatTime = anim.beatIndex * this.core.getBeatLength(); beatTime < offsetNow;
                beatTime = ++anim.beatIndex * this.core.getBeatLength()) {
            var beat = this.core.getBeat(anim.beatIndex);
            if(beat == anim.trigger) {
                anim.offset += anim.height * anim.direction;
                if(anim.offset < 0) {
                    anim.offset = 0;
                    anim.direction = 1;
                } else if(anim.offset + anim.height > this.height) {
                    anim.offset = this.height - anim.height;
                    anim.direction = -1;
                }
                this.anims.push( {
                    startTime : beatTime - anim.beatTime,
                    endTime : beatTime - anim.beatTime + anim.length,
                    lastFrame : -1,
                    imageArray : anim.images,
                    fps : anim.fps,
                    x : anim.align == "left" ? 0 : this.width - anim.width,
                    y : anim.offset,
                    w : anim.width,
                    h : anim.height
                });
            }
        }
    }, this);
    // draw active anims
    for(var i = 0; i < this.anims.length; i++) {
        var anim = this.anims[i];
        if(now < anim.startTime) {
            continue;
        }
        var frame = Math.floor((now-anim.startTime) * anim.fps) % anim.imageArray.length;
        // causes flickering, determining dirty regions is too much effort
        //if(frame != anim.lastFrame || redraw) {
            this.canvas.drawImage(anim.imageArray[frame], anim.x, anim.y);
            anim.lastFrame = frame;
        //}
    }
};

// On new song we nuke everything from orbit
Thunk.prototype.newSong = function() {
    for(var i = 0; i < this.anims.length; i++) {
        var anim = this.anims[i];
        this.canvas.clearRect(anim.x, anim.y, anim.w, anim.h);
        this.anims.splice(i--, 1);
    }
    videos.triggers.forEach(function(anim) {
        anim.beatIndex = this.core.beatIndex;
    }, this);
};

Thunk.prototype.resize = function() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.canvas.width = this.width;
    this.canvas.canvas.height = this.height;
};