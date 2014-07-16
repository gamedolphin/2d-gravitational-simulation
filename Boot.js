/* Created by Nambiar - 12/7/2014.
*/

SetUp = {};

buttons = {};

var bck,bmd;

var BasicSim = function(game){
    this.orbitCircles = null;
    this.circleMain = null;
    this.bck = null;
    this.bmd = null;
};

var fn, newFile;

BasicSim.prototype.preload = function(){


    fn = localStorage.getItem("FN");
    if(fn===null){
     fn = 'E1.txt';
     localStorage.setItem("FN",fn);
    }
    if(fn==='readFromLocal'){
        newFile = localStorage.getItem("newF");
    }
    else{
        this.load.text('setup', fn);
    }

    this.load.text('btns','buttons.txt');
    
};

BasicSim.prototype.create = function(){

    if(fn!='readFromLocal')
        jsonData = JSON.parse(this.game.cache.getText('setup'));
    else 
        jsonData = JSON.parse(newFile);

    SetUp = jsonData;

    buttons = JSON.parse(this.game.cache.getText('btns'));

    this.game.stage.backgroundColor = 0x000000;

    this.setUpScreen();

    this.setUpButtons();

    this.game.physics.startSystem(Phaser.Physics.P2JS);
    this.game.physics.p2.restitution = 0;
    this.game.physics.p2.friction = 0;

    this.setUpSuns();

    this.bmd = this.add.bitmapData(this.world.width,this.world.height);
    this.bck = this.add.sprite(0,0,this.bmd);
    bck = this.bck;
    bmd = this.bmd;

    this.setUpPlanets();
    
    this.game.time.advancedTiming = true;

};

BasicSim.prototype.update = function(){
    stats.begin();
    this.orbitCircles.forEachAlive(this.loop,this,this.circleMain);
    stats.end();
};

BasicSim.prototype.loop = function(p,s){

    p.accX = 0;
    p.accY = 0;

    for(var i=0;i<s.length;i++){
        var dX = s[i].x-p.x;
        var dY = s[i].y-p.y;
        var theta = Math.atan2(dY,dX);
        var rsq = dY*dY+dX*dX;

        if(rsq<200){
            if(s[i].devours)
                p.kill();
                if(s[i].absorbs){
                    s[i].mass += p.mass;
                }
            else
                rsq = 200;
        }
        var fg = p.mass*s[i].mass/(rsq);
        p.accX += fg*Math.cos(theta);
        p.accY += fg*Math.sin(theta);         
    }
    if(SetUp.planetGravity){
        p.parent.forEachAlive(function(a){
            if(this===a) return;
            var dX = a.x-this.x;
            var dY = a.y-this.y;
            var theta = Math.atan2(dY,dX);
            var rsq = dY*dY+dX*dX;

            if(rsq<100){
                rsq = 100;
            }
        var fg = this.mass*a.mass/(rsq); 
        this.accX += fg*Math.cos(theta);
        this.accY += fg*Math.sin(theta);   
        },p);
     }

    p.body.force.x = p.accX;
    p.body.force.y = p.accY;
    
    if(this.bck.alive){

        this.bmd.circle(p.x, p.y, 1,p.colorval);

        this.bmd.dirty = true;
    }
    
};

BasicSim.prototype.setUpScreen = function(){

    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;
    this.scale.setScreenSize(true);
};

BasicSim.prototype.setUpSuns = function(){
    this.circleMain = [];
    for(var i=0;i<SetUp.noOfSuns;i++){
        var tempOBJ = SetUp.sunData[i];
        if(tempOBJ==undefined){
            tempOBJ = SetUp.planetData[0];
        }
        if(typeof(tempOBJ)==='number'){
            var tempOBJ = SetUp.planetData[tempOBJ];
        }
        var tempSun = this.createCircle(tempOBJ,i);
        tempSun.mass = tempOBJ.mass;
        tempSun.devours = tempOBJ.devours;
        this.circleMain.push(tempSun);
    }
};

BasicSim.prototype.setUpPlanets = function(){

    this.orbitCircles = this.add.group();
    for(var i=0;i<SetUp.noOfPlanets;i++){

        var tempOBJ = SetUp.planetData[i];
        if(tempOBJ==undefined){
            tempOBJ = SetUp.planetData[0];
        }
        if(typeof(tempOBJ)==='number'){
            var tempOBJ = SetUp.planetData[tempOBJ];
        }
        var tempPlanet = this.createCircle(tempOBJ,i);

        if(typeof(tempOBJ.mass)==='string')
            tempPlanet.mass = FuncList[tempOBJ.mass](tempOBJ.mArgList,tempPlanet,i);
        else tempPlanet.mass = tempOBJ.mass;
        if(typeof(tempOBJ.vX)==='string')
            tempPlanet.vX = FuncList[tempOBJ.vX](tempOBJ.vXArgList,tempPlanet,i);
        else tempPlanet.vX = tempOBJ.vX;
        if(typeof(tempOBJ.vY)==='string')
            tempPlanet.vY = FuncList[tempOBJ.vY](tempOBJ.vYArgList,tempPlanet,i);
        else tempPlanet.vY = tempOBJ.vY;

        this.physics.p2.enable(tempPlanet);
        tempPlanet.body.setCircle(tempPlanet.radius);
        tempPlanet.body.damping = 0;
        tempPlanet.body.angularDamping = 0;

        tempPlanet.body.velocity.x = tempPlanet.vX;
        tempPlanet.body.velocity.y = tempPlanet.vY;

        tempPlanet.inputEnabled = true;
        tempPlanet.events.onInputDown.add(function(a){
                a.kill();
        },this);

        this.orbitCircles.addChild(tempPlanet);

    }

};



BasicSim.prototype.createCircle = function(OBJ,index){
    var xS = this.world.centerX;
    var yS = this.world.centerY;
    var rad = 10;
    var color = 0xffffff;
    if(typeof(OBJ.x)=='string')
            xS = FuncList[OBJ.x](OBJ.xArgList,OBJ,index);
        else xS += OBJ.x
    if(typeof(OBJ.y)=='string')
        yS = FuncList[OBJ.y](OBJ.yArgList,OBJ,index);
    else yS += OBJ.y; 
    if(typeof(OBJ.radius)=='string')
        rad = FuncList[OBJ.radius](OBJ.rArgList,OBJ,index);
    else rad = OBJ.radius; 
    if(typeof(OBJ.color)=='string')
        color = FuncList[OBJ.color](OBJ.cArgList,OBJ,index);
    else color = OBJ.color; 

    var circleGraphic = this.add.graphics(0,0);
    circleGraphic.lineStyle(0);
    circleGraphic.beginFill(color, 1);
    circleGraphic.drawCircle(0,0,rad);

    var sprite = this.add.sprite();
    sprite.addChild(circleGraphic);
    sprite.x = xS;
    sprite.y = yS;
    sprite.radius = rad;
    sprite.colorval = "rgba("+Phaser.Color.getRed(color)+","+Phaser.Color.getGreen(color)+","+Phaser.Color.getBlue(color)+",0.2)";

    return sprite;
};

BasicSim.prototype.setUpButtons = function(){
    var tt = document.getElementById('buttons');
    for(var i = 0; i <buttons.list.length; i++) {
        var option = document.createElement('option');
        option.text = option.value = buttons.list[i].name;
        tt.add(option, i);
        if(fn===buttons.list[i].fn){
            option.selected = "selected";
        }
    }
    tt.onchange = this.buttonClick;


};

BasicSim.prototype.buttonClick = function(){
    var selected = this.selectedIndex;
    var name = this.options[selected].value;
    for(var i=0;i<buttons.list.length;i++){
        if(name===buttons.list[i].name){
            localStorage.setItem("FN",buttons.list[i].fn);
        }
    }
    location.reload(true);
};


FuncList = {
    'rnd' : function(argList){
        var value = 0;
        if(typeof(argList)==='string'){
            switch(argList){
                case 'width'    :   value = Math.floor(Math.random() * (window.innerWidth + 1));
                                    break;
                case 'height'   :   value = Math.floor(Math.random() * (window.innerHeight + 1));
                                    break;
                case 'allColors':   value = Phaser.Color.getRandomColor();
                                    break;
            }
        }
        else{
            var max = argList[0];
            var min = argList[1];
            value = Math.floor(Math.random() * (max - min + 1)) + min;
        }
        return value;
    },
    'equals10' : function(argList,ob){
        return ob[argList]*10;
    },

    'func1' : function(argList,ob,index){
        var tsun = SetUp.sunData[argList[1]];
        switch(argList[0]){
            case "x" : return tsun.x + window.innerWidth/2  - argList[2] - index*argList[3];
                        break;
            case "y" : return tsun.y + window.innerHeight/2 - argList[2] - index*argList[3];
                        break;
        }
        return index*argList[3];
    },

    'func2' : function(argList,ob,index){
        var tsun = SetUp.sunData[argList[0]];
        var dX = tsun.x + window.innerWidth/2 - ob.x;
        var dY = tsun.y + window.innerHeight/2 - ob.y;
        var rsq = Math.sqrt(dX*dX + dY*dY);
        return argList[1]*Math.sqrt(SetUp.sunData[argList[0]].mass*ob.mass/(rsq));
    },
};