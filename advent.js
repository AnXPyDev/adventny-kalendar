{
let sprites = {};
let canvas = document.getElementById("advent-canvas");
let dataCanvas = document.createElement("canvas");
let ctx = canvas.getContext("2d");
let dataCtx = dataCanvas.getContext("2d");


function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randUnevenInt(min, max) {
  return Math.floor(min + Math.pow(Math.random(), 3) * (max - min + 1));
}

function randSign() {
  return Math.sign(Math.random() - 0.5);
}

function wrapAngle(angle) {
  if (angle < 0) {
    Math.PI * 2 - angle;
  } else if (angle > Math.PI * 2) {
    return angle - Math.PI * 2;
  }
  return angle;
}

function wrap(val, min, max) {
  if (val < min) {
    return max - Math.abs(min - val);
  } else if (val > max) {
    return min + Math.abs(val - max);
  }
  return val;
}

function wrap_np(val, min, max) {
  if (val < min) {
    return max;
  } else if (val > max) {
    return min;
  }
  return val;
}

function clampRight(val, target) {
  if (val > target) {
    return target;
  }
  return val;
}

function clampLeft(val, target) {
  if (val < target) {
    return target;
  }
  return val;
}

function clamp(val, min, max) {
  if (val < min) {
    return min;
  } else if (val > max) {
    return max;
  }
  return val;
}

function approach(val, target, ammount) {
  if (val < target) {
    return clampRight(val + Math.abs(ammount), target);
  } else if (val > target) {
    return clampLeft(val - Math.abs(ammount), target);
  }
  return target;
}

function lerp(val, target, mag) {
  return val + (target - val) * mag;
}

class V2 {
  constructor(x = 0, y = x) {
    this.x = x;
    this.y = y;
  }
}

function copyV2(v2) {
  return new V2(v2.x, v2.y);
}

let ent = [];
let clickable = [];
let env = {}
env.tickrate = 60;
env.ammount = 200;
env.max_size = 50;
env.min_size = 10;
env.rand_offset = canvas.height;
env.min_speed = 5;
env.max_speed = 10;
env.max_wind_speed = 15;
env.min_wind_speed = 2;
env.wind_acc = 0.02;
env.alpha_max = 1;
env.alpha_min = 0.6;
env.size_diff = env.max_size - env.min_size;
env.wind_speed = 0;
env.speed_diff = env.max_speed - env.min_speed;
env.alpha_diff = env.alpha_max - env.alpha_min;
env.speed_mul = 0.1;
env.wind_period_max = 20 * 1000;
env.wind_period_min = 5 * 1000;

class Snowflake {
  constructor() {
    this.size = new V2(randUnevenInt(env.min_size, env.max_size));
    this.mul = (this.size.x - env.min_size) / env.size_diff;
    this.vel = new V2(0, randInt(env.min_speed, env.max_speed));
    this.pos = new V2(randInt(0, canvas.width), -this.size.y / 2 - randInt(0, env.rand_offset));
    this.rot = Math.random() * Math.PI * 2;
    this.rotvel = Math.random() * this.mul * 0.01;
    this.alpha = env.alpha_min + (1 - this.mul) * env.alpha_diff;
    this.depth = Math.round(this.mul * 10);
  }
  tick() {
    this.rot = wrapAngle(this.rot + this.rotvel);
    this.vel.x = approach(this.vel.x, env.wind_speed, env.wind_acc);
    this.pos.y += this.vel.y * (env.speed_mul + this.mul * (1 - env.speed_mul));
    this.pos.x = wrap(this.pos.x + this.vel.x * this.mul, -this.size.x / 2, canvas.width + this.size.x / 2);
    if (this.pos.y > canvas.height + this.size.y / 2) {
      this.pos.y = -this.size.y / 2 - randInt(0, env.rand_offset);
    }
  }
  draw() {
    ctx.save();
    ctx.translate(env.camera.pos.x + this.pos.x, env.camera.pos.y + this.pos.y);
    ctx.rotate(this.rot);
    ctx.globalAlpha = this.alpha;
    ctx.drawImage(sprites.snowflake, -this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
    ctx.restore();
  }
}

function pointRectCollision(point, rpos, rsize) {
  return (point.x >= (rpos.x - rsize.x / 2) && point.x <= (rpos.x + rsize.x / 2) && point.y >= (rpos.y - rsize.x / 2) && point.y <= (rpos.y + rsize.y / 2));
}

let present = {}
present.default_size = 90;
present.max_size = 120;
present.default_depth = 5.5;

class Present {
  constructor(pos, link, active = true, i = 1, call_wreath = true, conf = [present.default_size, present.max_size, present.default_depth]) {
    this.pos = pos;
    this.size = new V2(10);
    this.max_s = conf[1];
    this.min_s = conf[0];
    this.link = link;
    this.depth = conf[2];
    this.default_depth = this.depth;
    this.hovered = false;
    this.active = active;
    this.call_wreath = call_wreath;
    this.i = i;
    this.hue = (i - 1) * (360 / 24);
    if (this.active) {
      this.box_sprite = shift_hsl(sprites.present_box, this.hue);
      this.bow_sprite = shift_hsl(sprites.present_bow, 0);
      this.num_sprite = shift_hsl(sprites["n" + i.toString()], 0);
    } else {
      this.box_sprite = shift_hsl(sprites.present_box, 0, 0);
      this.bow_sprite = shift_hsl(sprites.present_bow, 0, 0);
      this.num_sprite = shift_hsl(sprites["n" + i.toString()], 0, 0);
    }
    


    this.size.y = (this.size.x / this.box_sprite.width) * this.box_sprite.height;
  }
  tick() {
    if (this.hovered) {
      this.size.x = lerp(this.size.x, this.max_s, 0.2);
    } else {
      this.size.x = lerp(this.size.x, this.min_s, 0.2);
    }
    this.size.y = (this.size.x / this.box_sprite.width) * this.box_sprite.height;
  }
  draw() {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(this.box_sprite, this.pos.x - this.size.x / 2, this.pos.y - this.size.y / 2, this.size.x, this.size.y);
    ctx.drawImage(this.bow_sprite, this.pos.x - this.size.x / 2, this.pos.y - this.size.y / 2, this.size.x, this.size.y);
    ctx.drawImage(this.num_sprite, this.pos.x - this.size.x / 2, this.pos.y - this.size.y / 2, this.size.x, this.size.y);
    ctx.restore();

  }
  click(pos) {
    if (this.link) {
      window.open(this.link);
    }

    return true;
  }
  hover(pos) {
    return this.active && pointRectCollision(pos, this.pos, this.size);
  }
  setHover() {
    this.hovered = true;
    this.depth = 100;
    this.call_wreath && env.wreath.setTarget(this);
  }
  unsetHover() {
    this.hovered = false;
    this.depth = this.default_depth;
    this.call_wreath && env.wreath.unsetTarget(this);
  }

}

class Background {
  constructor() {
    this.depth = -100;
    this.sprite = sprites.background;
    this.size = new V2(500);
    this.size.y = (this.size.x / this.sprite.width) * this.sprite.height;
    this.off = new V2(0);
    this.vel = new V2(env.wind_speed,-0.5);
  }
  tick() {
    this.vel.x = approach(this.vel.x, -env.wind_speed / 8, env.wind_acc);
    this.off.x = wrap(this.off.x + this.vel.x, 0, this.size.x);
    this.off.y = wrap(this.off.y + this.vel.y, 0, this.size.y);
  }
  draw() {
    ctx.save()
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.clip()
    let nx = Math.ceil(canvas.width / this.size.x) + 2;
    let ny = Math.ceil(canvas.height / this.size.y) + 2;
    let cx = (canvas.width / 2) - (this.size.x * nx / 2) + Math.floor(this.off.x);
    let ocy = (canvas.height / 2) - (this.size.y * ny / 2) + Math.floor(this.off.y);
    let cy = ocy;
    for (let ix = 0; ix < nx; ix++) {
      cy = ocy;
      for (let iy = 0; iy < ny; iy++) {
        ctx.drawImage(this.sprite, cx - this.size.x / 2, cy - this.size.y / 2, this.size.x, this.size.y);
        cy += this.size.y;
      }
      cx += this.size.x;
    }
    ctx.restore();
  }
}

class Snow {
  constructor() {
    this.depth = 3.5;
    this.sprite = sprites.snow;
    this.size = new V2(500);
    this.size.y = (this.size.x / this.sprite.width) * this.sprite.height;
    this.off = new V2(0);
    this.height = 0.3;
  }
  tick() {}
  draw() {
    ctx.save()
    ctx.beginPath();
    ctx.rect(0, canvas.height * (1 - this.height), canvas.width, canvas.height * (2 - this.height));
    ctx.clip()
    let nx = Math.ceil(canvas.width / this.size.x) + 2;
    let ny = Math.ceil(canvas.height * (2 - this.height) / this.size.y) + 2;
    let cx = (canvas.width / 2) - (this.size.x * nx / 2) + Math.floor(this.off.x);
    let ocy = (canvas.height * this.height / 2 + canvas.height * (1 - this.height) - (this.size.y * ny / 2)) + Math.floor(this.off.y);
    let cy = ocy;
    for (let ix = 0; ix < nx; ix++) {
      cy = ocy;
      for (let iy = 0; iy < ny; iy++) {
        ctx.drawImage(this.sprite, cx - this.size.x / 2, cy - this.size.y / 2, this.size.x, this.size.y);
        cy += this.size.y;
      }
      cx += this.size.x;
    }
    ctx.restore();
  }
}

class Tree {
  constructor() {
    this.depth = 4.5;
    this.sprite = sprites.tree;
    this.pos = new V2(canvas.width / 2, canvas.height / 2 + 10);
    env.tree_pos = this.pos;
    this.size = new V2(360);
    this.size.y = (this.size.x / this.sprite.width) * this.sprite.height;
  }
  tick() {}
  draw() {
    ctx.drawImage(this.sprite, this.pos.x - this.size.x / 2, this.pos.y - this.size.y / 2, this.size.x, this.size.y);
  }
}

class Camera {
  constructor() {
    this.pos = new V2();
    this.target_pos = new V2(0);
    this.depth = 0;
  }
  tick() {
    this.pos.x = lerp(this.pos.x, this.target_pos.x, 0.2);
    this.pos.y = lerp(this.pos.y, this.target_pos.y, 0.2);
  }
  draw() {}
}


class ScrollButton {
  constructor() {
    this.poss = [];
    this.angs = [];
    this.cams = []
    this.poss[0] = new V2(0 + 50, canvas.height - 50);
    this.poss[1] = new V2(0 + 50, canvas.height + 50);
    this.angs[0] = 0;
    this.angs[1] = Math.PI;
    this.cams[0] = new V2(0, canvas.height);
    this.cams[1] = new V2(0, 0);
    this.ix = 0;
    this.pos = new V2(this.poss[0].x, this.poss[1].y);
    this.ang = this.angs[0];
    this.size = new V2(40);
    this.max_s = 45
    this.min_s = 40
    this.hovered = false;
    this.sprite = sprites.arrow;
    this.depth = 50;
    this.size.y = (this.size.x / this.sprite.width) * this.sprite.height;
  }

  tick() {
    if (this.hovered) {
      this.size.x = lerp(this.size.x, this.max_s, 0.2);
    } else {
      this.size.x = lerp(this.size.x, this.min_s, 0.2);
    }
    this.size.y = (this.size.x / this.sprite.width) * this.sprite.height;
    this.pos.x = lerp(this.pos.x, this.poss[this.ix].x, 0.2);
    this.pos.y = lerp(this.pos.y, this.poss[this.ix].y, 0.2);
    this.ang = lerp(this.ang, this.angs[this.ix], 0.2);
  }
  draw() {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.ang);
    ctx.drawImage(this.sprite, -this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
    ctx.restore();
  }
  
  click(pos) {
    env.camera.target_pos = this.cams[this.ix];
    this.ix = wrap_np(this.ix + 1, 0, 1);
    env.page = this.ix;
    return true;
  }
  
  hover(pos) {
    return pointRectCollision(pos, this.pos, this.size);
  }

  setHover() {
    this.hovered = true;
  }
  unsetHover() {
    this.hovered = false; 
  }
}

env.page = 0;

class Wreath {
  constructor() {
    this.target = false;
    this.default_targets = [{pos: new V2()}];
    this.pos = new V2();
    this.size = new V2(140);
    this.sprite = sprites.wreath;
    this.depth = 4.6;
    this.ang = 0;
    this.size.y = (this.size.x / this.sprite.width) * this.sprite.height;
    this.cd = 0;
    this.targeting = false;
  }
  tick() {
    //this.ang = wrap(this.ang + 0.002, 0, Math.PI);
    let target = this.default_targets[1].pos;
    if (!this.targeting) {
      this.cd--;
      if (this.cd > 0) {
        target = this.target.pos;
      }
    } else if (this.targeting) {
      target = this.target.pos;
    }

    this.pos.x = lerp(this.pos.x, target.x, 0.2);
    this.pos.y = lerp(this.pos.y, target.y, 0.2);
  }
  draw() {
    ctx.save()
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.ang);
    ctx.drawImage(this.sprite, -this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
    ctx.restore();
  }
  setTarget(target) {
    this.targeting = true;
    this.target = target;
    this.cd = 60;
  }
  unsetTarget(target) {
    if (this.target == target) {
      this.targeting = false;
    }
  }
}


function change_wind() {
  env.wind_speed = randInt(env.min_wind_speed, env.max_wind_speed) * randSign();
  env.wind_timeout = setTimeout(() => {change_wind()}, randInt(env.wind_period_max, env.wind_period_min));
}

function tick() {
  for (let i = 0; i < ent.length; i++) {
    ent[i].tick();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(Math.round(-env.camera.pos.x), Math.round(-env.camera.pos.y));
  ent.sort(function(a, b) {
    if (a.depth < b.depth) {
      return -1;
    } else if (a.depth > b.depth) {
      return 1;
    }
  });
  let x = "";
  for (let i = 0; i < ent.length; i++) {
    ent[i].draw();
  }
  ctx.restore();
  window.requestAnimationFrame(() => {draw()});
}

function make_present(...args) {
  let p = new Present(...args);
  ent.push(p);
  clickable.push(p);
}

function on_hover(event) {
  let h = false;
  let pos = new V2(event.layerX + env.camera.pos.x, event.layerY + env.camera.pos.y);
  clickable.sort(function(a, b) {
    if (a.depth < b.depth) {
      return -1;
    } else if (a.depth > b.depth) {
      return 1;
    }
  });
  for (let i = 0; i < clickable.length; i++) {
    if (clickable[i].hover(pos)) {
      canvas.style.cursor = "pointer";
      if (!h) {
        clickable[i].setHover();
      } else {
        clickable[i].unsetHover();
      }
      h = true;
    } else {
      clickable[i].unsetHover();
    }
  }
  if (!h) {
    canvas.style.cursor = "default";
  }
}

function on_click(event) {
  let h = false;
  let pos = new V2(event.layerX + env.camera.pos.x, event.layerY + env.camera.pos.y);
  clickable.sort(function(a, b) {
    if (a.depth < b.depth) {
      return -1;
    } else if (a.depth > b.depth) {
      return 1;
    }
  });
  for (let i = 0; i < clickable.length; i++) {
    if (clickable[i].hover(pos)) {
      clickable[i].click();
      break;
    }
  }
}



let present_poss = [
  [new V2(0, 220), [110, 130, 5.5]],
  [new V2(-100, 200), [100, 125, 5.5]],
  [new V2(100, 200), [100, 125, 5.5]],
  [new V2(-200, 180), [90, 120, 5.5]],
  [new V2(200, 180), [90, 120, 5.5]]
]

let presents = [];


let current_day = 4;

for (let i = 0; i < 24; i++) {
  if (i < current_day) {
    presents.push(["", true]);
  } else {
    presents.push(["", false]);
  }
}
  
presents[0][0] = "https://www.youtube.com/watch?v=GOkgtQHTvQ0&feature=youtu.be";
presents[1][0] = "https://www.youtube.com/watch?v=ywwlIWz1ZEM&feature=youtu.be";
presents[2][0] = "https://gymvrable.sk/img/2020/advent/pdf/prezentacia_fit_den.pdf";
presents[3][0] = "";

console.log(presents.length);

env.wreath_targets = [];

function spawn_presents() {
  let mx = 50;
  let my = 100;
  let sx = canvas.width - 2 * mx;
  let sy = canvas.height - 2 * my;
  let ox = sx / 6;
  let oy = sy / 4;
  let i = 0;
  for (let y = 0; y < 4; y++) {
    let xoff = (ox / 4) * Math.pow(-1, y + 1);
    for (let x = 0; x < 6; x++) {
      let pos = new V2(mx + (x + 0.5) * ox + xoff, canvas.height + my + (y + 0.5) * oy);
      make_present(pos, presents[i][0], presents[i][1], i + 1);
      
      if (i + 1 == current_day) {
        env.wreath.default_targets[1] = ent[ent.length - 1];
      }

      i++;
    }
  }
   
  for (let i = 0; i < present_poss.length; i++) {
    let x = current_day - (i + 1);
    let pos = new V2(present_poss[i][0].x + canvas.width / 2, present_poss[i][0].y + canvas.height / 2)
    if (x >= 0) {
      make_present(pos, presents[x][0], presents[x][1], x + 1, false, present_poss[i][1]);
      if (i == 0) {
        env.wreath.default_targets[0] = ent[ent.length - 1];
        env.pos = copyV2(pos);
      }

    }
  }
  


}

function init() {

  for (let i = 0; i < env.ammount; i++) {
    ent.push(new Snowflake());
  }
  ent.push(new Background());
  ent.push(new Tree());
  ent.push(new Snow());
  env.camera = new Camera();
  ent.push(env.camera);
  let e = new ScrollButton();
  ent.push(e); clickable.push(e);
  env.wreath = new Wreath();
  ent.push(env.wreath);

  spawn_presents();
  //make_present(new V2(canvas.width / 2 , canvas.height * 1.5), sprites.present2, "https://gymvrable.sk");
  canvas.addEventListener("click", (event) => {on_click(event)});
  canvas.addEventListener("mousemove", (event) => {on_hover(event)});
  env.tick_inteval = setInterval(() => {tick()}, 1000/env.tickrate);
  change_wind();

  window.requestAnimationFrame(() => {draw()});

}

function shift_hsl(image, h, s = 100) {
  dataCanvas.width = image.width;
  dataCanvas.height = image.height;
  dataCtx.save();
  dataCtx.clearRect(0, 0, image.width, image.height);
  dataCtx.globalCompositeOperation = "source-over";
  dataCtx.drawImage(image, 0, 0);
  dataCtx.globalCompositeOperation = "saturation";
  dataCtx.fillStyle = "hsl(0," + s.toString() + "%, 50%)";
  dataCtx.fillRect(0, 0, dataCanvas.width, dataCanvas.height);
  dataCtx.globalCompositeOperation = "hue";
  dataCtx.fillStyle = "hsl(" + h + ",1%, 50%)";
  dataCtx.fillRect(0, 0, dataCanvas.width, dataCanvas.height);
  dataCtx.globalCompositeOperation = "destination-in";
  dataCtx.drawImage(image, 0, 0);
  dataCtx.restore();
  let nimg = new Image();
  nimg.src = dataCanvas.toDataURL();
  return nimg;
  
}

let req_load = 0;
let load = 0;

function load_sprite(name, path) {
  req_load++;
  let img = new Image();
  img.addEventListener("load", () => {
    load++;
    if (load >= req_load) {
      init();
    }
    console.log("load", name, req_load, load);
  });
  img.addEventListener("error", () => {
    load++;
    if (load >= req_load) {
      init();
    }
    console.log("load error", name, req_load, load);
  });
  img.src = path;
  sprites[name] = img;
}


load_sprite("snowflake", "img/snowflake.png");
load_sprite("background", "img/background.jpg");
load_sprite("tree", "img/tree.png");
load_sprite("snow", "img/snow.jpg");
load_sprite("arrow", "img/arrow.png");
load_sprite("wreath", "img/wreath.png");
load_sprite("present_box", "img/present_box.png");
load_sprite("present_bow", "img/present_bow.png");

for (let i = 1; i <= 24; i++) {
  load_sprite("n" + i.toString(), "img/numbers/" + i.toString() + ".png");
}

}