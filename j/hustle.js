function Hustle(core) {
    this.core = core;
    
    this.loaded = false;
    
    core.addEventListener("beat", this.onBeat.bind(this));
    core.addEventListener("songstarted", this.hide.bind(this));
    core.addEventListener("loaded", this.init.bind(this));
    
    this.image = document.createElement("div");
    this.image.className = "hustle";
    document.body.appendChild(this.image);
    
    
    this.imageIndex = 0;
}

Hustle.prototype.init = function() {
    // HARDCODED
    this.respack = this.core.resourceManager.resourcePacks[2];
    this.core.resourceManager.removePack(this.respack);
    this.loaded = true;
    console.log("Hustle loaded");
}

Hustle.prototype.onBeat = function(beatString, beatIndex) {
    if(!this.loaded)
        return;
    if(beatString[0] == 'w') {
        this.image.style.backgroundImage = "url('" + this.respack.images[this.imageIndex].bitmap.src + "')";
        this.imageIndex = ++this.imageIndex % this.respack.images.length;
        this.show();
    } else if(beatString[0] == 'r') {
        this.hide();
    }
}

Hustle.prototype.show = function() {
    this.image.classList.add('hustle--visible');
}

Hustle.prototype.hide = function() {
    this.image.classList.remove('hustle--visible');
}