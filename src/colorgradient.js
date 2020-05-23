// color gradients

export class ColorGradient {
  constructor(colors, opt) {
    opt = opt || {};
    
    this.colors = [];
    this.lerpHSL = opt.lerpHSL || false;
    
    if(colors) { this.addStops(colors); }
  }
  addStops(arr) {
    for(let c of arr) {
      this.addStop(c);
    }
  }
  addStop(c) {
    this.colors.push(c);
  }
    
  firstColor() {
    return this.colors.length > 0 ? this.colors[0].color : undefined;
  }
  lastColor() {
    return this.colors.length > 0 ? this.colors[this.colors.length - 1].color : undefined;
  }
  
  mixOfColor(i, j, amt) {
    if(i < 0 || i >= this.colors.length || j < 0 || j >= this.colors.length) return undefined;
    let c = this.colors[i].color.clone(), c2 = this.colors[j].color;
    if(this.lerpHSL) return c.lerpHSL(c2, amt);
    else return c.lerp(c2, amt);
  }
  
  colorForValue(v) {
    if(this.colors.length < 1) return undefined;
    
    if(v < this.colors[0].stop) return this.firstColor();
    
    for(let i = 0; i < this.colors.length - 1; i++) {
      let s1 = this.colors[i].stop, s2 = this.colors[i + 1].stop;
      if(s1 < v && v < s2) {
        let amt = (v - s1) / (s2 - s1);
        return this.mixOfColor(i, i + 1, amt);
      }
    }
    return this.lastColor();
  }
}