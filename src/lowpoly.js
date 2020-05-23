import { Helper } from './lphelper.js'
import { Icosahedron, Plane, Pyramid, Cylinder, Triangle, Box } from './lpbaseobjects.js'

export class LowPolyGeometry {
  constructor(opt) {
    opt = opt || {};
    
    this.computeNormals = opt.computeNormals != undefined ? opt.computeNormals : true;
    this.normalizeVertices = opt.normalizeVertices != undefined ? opt.normalizeVertices : false;
    
    this.subdivisions = opt.subdivisions || 0;
  }
  createVertices() {
    this.targetVertices = [];
  }
  
  removeFaces(removeFunction) {
    this.checkVertices();
    
    let vert = this.targetVertices;
    let newTarget = [];
    for(let i = 0; i < vert.length; i += 9) {
      let a = [vert[i], vert[i + 1], vert[i + 2]];
      let b = [vert[i + 3], vert[i + 4], vert[i + 5]];
      let c = [vert[i + 6], vert[i + 7], vert[i + 8]];
      if(this.normalizeVertices) {
        Helper.normalizeArrayVertex(a);
        Helper.normalizeArrayVertex(b);
        Helper.normalizeArrayVertex(c);
      }
      if(!removeFunction(a, b, c)) {
        for(let j = 0; j < 9; j++) { 
          newTarget.push(vert[i + j]);
        }
      }
    }
    this.targetVertices = newTarget;
  }
  
  setVertexHeight(heightFunction) {
    this.checkVertices();
    var vert = this.targetVertices;
    
    for(let i = 0; i < vert.length; i += 3) {
      // get current triangle
      let a = [vert[i], vert[i + 1], vert[i + 2]];
      let h = heightFunction(a) / (this.normalizeVertices ? Helper.getArrayVertexLength(a) : 1);
      vert[i] *= h;
      vert[i + 1] *= h;
      vert[i + 2] *= h;
    }
    this.targetVertices = vert;
  }
  
  setVertexColor(colorFunction) {
    this.checkVertices();
    let colors = [], vert = this.targetVertices;
    for(let i = 0; i < vert.length; i += 3) {
      let a = [vert[i], vert[i + 1], vert[i + 2]];
      if(this.normalizeVertices) Helper.normalizeArrayVertex(a);
      let color = colorFunction(a);
      colors.push(color.r, color.g, color.b);
    }
    this.colors = colors;
  }

  // add average color of triangles
  setFaceColor(colorFunction) {
    this.checkVertices();
    let colors = [], vert = this.targetVertices;
    for(let i = 0; i < vert.length; i += 9) {
      let a = [vert[i], vert[i + 1], vert[i + 2]];
      let b = [vert[i + 3], vert[i + 4], vert[i + 5]];
      let c = [vert[i + 6], vert[i + 7], vert[i + 8]];
      if(this.normalizeVertices) {
        Helper.normalizeArrayVertex(a);
        Helper.normalizeArrayVertex(b);
        Helper.normalizeArrayVertex(c);
      }
      let color = colorFunction(a, b, c);
      for(let j = 0; j < 3; j++) {
        colors.push(color.r);
        colors.push(color.g);
        colors.push(color.b);
      }
    }
    this.colors = colors;
  }
  
  // deform function should return an array with three elements, being the movement vector of that vertex
  deformVertex(deformFunction) {
    this.checkVertices();
    var vert = this.targetVertices;
    
    for(let i = 0; i < vert.length; i += 3) {
      // get current triangle
      let a = [vert[i], vert[i + 1], vert[i + 2]];
      let transform = deformFunction(a);
      if(transform) {
        vert[i] += transform[0];
        vert[i + 1] += transform[1];
        vert[i + 2] += transform[2];
      }
    }
    this.targetVertices = vert;
  }
  
  setUV(uvFunction) {
    this.checkVertices();
    let uvs = [], vert = this.targetVertices;
    for(let i = 0; i < vert.length; i += 3) {
      let a = [vert[i], vert[i + 1], vert[i + 2]];
      if(this.normalizeVertices) Helper.normalizeArrayVertex(a);
      let uv = uvFunction(a, Math.floor(i / 3) % 3);
      uvs.push(uv[0], uv[1]);
    }
    this.uvs = uvs;
  }
  
  setVertexHeightFromNoise(noise) {
    let heightFunction = (a) => { return noise.getValue(a[0], a[1], a[2]); };
    this.setVertexHeight(heightFunction);
  }
  
  setVertexColorFromNoiseGradient(noise, gradient) {
    let colorFunction = (a) => { return gradient.colorForValue(noise.getNormalizedValue(a[0], a[1], a[2])) };
    this.setVertexColor(colorFunction);
  }
  
  setFaceColorFromNoiseGradient(noise, gradient) {
    let colorFunction = (a, b, c) => { return Helper.averageColor(gradient.colorForValue(noise.getNormalizedValue(a[0], a[1], a[2])), 
                                                                  gradient.colorForValue(noise.getNormalizedValue(b[0], b[1], b[2])), gradient.colorForValue(noise.getNormalizedValue(c[0], c[1], c[2]))) };
    this.setFaceColor(colorFunction);
  }
  
  setVertexHeightAndFaceColorFromNoiseGradient(noise, gradient) {
    this.setFaceColorFromNoiseGradient(noise, gradient);
    this.setVertexHeightFromNoise(noise);
  }
  
  createGeometry() {
    this.checkVertices();
    var bufferedVertices = new Float32Array(this.targetVertices.length);
    if(this.colors) var bufferedColor = new Float32Array(this.colors.length);
    if(this.uvs) var bufferedUVs = new Float32Array(this.uvs.length);

    for(let i = 0; i < this.targetVertices.length; i++) {
      bufferedVertices[i] = this.targetVertices[i];
    }
    for(let i = 0; this.colors && i < this.colors.length; i++) {
      bufferedColor[i] = this.colors[i];
    }
    for(let i = 0; this.uvs && i < this.uvs.length; i++) {
      bufferedUVs[i] = this.uvs[i];
    }
    
    var geo = Helper.newBufferGeometry();
    Helper.setGeometryAttribute(geo, 'position', bufferedVertices, 3);
    if(this.colors) Helper.setGeometryAttribute(geo, 'color', bufferedColor, 3);
    if(this.uvs) Helper.setGeometryAttribute(geo, 'uv', bufferedUVs, 2);
    
    if(this.computeNormals == true) geo.computeVertexNormals();
    
    return geo;
  }
  
  checkVertices() {
    if(!this.targetVertices) this.createVertices();
  }
}

export class ModifiedIcosahedron extends LowPolyGeometry {
  constructor(opt) {
    opt = opt || {};
    super(opt);
    
    this.subdivisions = opt.subdivisions || 0;
  }
  createVertices() {
    this.targetVertices = new Icosahedron({subdivisions: this.subdivisions}).getVertices();
  }
}

export class ModifiedPyramid extends LowPolyGeometry {
  constructor(opt) {
    opt = opt || {};
    super(opt);
    
    this.height = opt.height || 1;
    this.sides = opt.sides || 3;
    this.subdivisions = opt.subdivisions || 0;
    this.includeBase = opt.includeBase || false;
  }
  createVertices() {
    this.targetVertices = new Pyramid({subdivisions: this.subdivisions, sides: this.sides, height: this.height, includeBase: this.includeBase}).getVertices();
  }
}

export class ModifiedCylinder extends LowPolyGeometry {
  constructor(opt) {
    opt = opt || {};
    super(opt);
    
    this.height = opt.height;
    this.sides = opt.sides;
    this.normalizeCylinder = opt.normalizeCylinder != undefined ? opt.normalizeCylinder : true;
    this.rows = opt.rows;
  }
  createVertices() {
    this.targetVertices = new Cylinder({subdivisions: this.subdivisions, sides: this.sides, height: this.height, rows: this.rows}).getVertices();
  }
  
  setVertexHeight(heightFunction) {
    this.checkVertices();
    var vert = this.targetVertices;
    
    for(let i = 0; i < vert.length; i += 3) {
      // get current triangle
      let aZero = [vert[i], 0, vert[i + 2]];
      let a = [vert[i], vert[i + 1], vert[i + 2]];
      let h = heightFunction(a) / (this.normalizeCylinder ? Helper.getArrayVertexLength(aZero) : 1);
      // does that make sense? (ignoring y) not sure, but results are ok (at least with more sides, minimum ~6)
      // and doesnt work with caps (base and top)
      vert[i] *= h;
      vert[i + 2] *= h;
    }
    this.targetVertices = vert;
  }
}

export class ModifiedPlane extends LowPolyGeometry {
  constructor(opt) {
    opt = opt || {};
    super(opt);
    
    this.subdivisions = opt.subdivisions || 0;
    this.normalizeVertices = false;
  }
  createVertices() {
    this.targetVertices = new Plane({subdivisions: this.subdivisions}).getVertices();
  }
  
  setVertexHeight(heightFunction) {
    this.checkVertices();
    var vert = this.targetVertices;
    for(let i = 0; i < vert.length; i += 3) {
      // ignore y coordinate
      let a = [vert[i], 0, vert[i + 2]];
      vert[i + 1] = heightFunction(a);
    }
    this.targetVertices = vert;
  }
  
  setVertexColor(colorFunction) {
    this.checkVertices();
    let colors = [], vert = this.targetVertices;
    for(let i = 0; i < vert.length; i += 3) {
      // ignore y coordinate
      let a = [vert[i], 0, vert[i + 2]];
      let color = colorFunction(a);
      colors.push(color.r, color.g, color.b);
    }
    this.colors = colors;
  }
  
  setFaceColor(colorFunction) {
    this.checkVertices();
    let colors = [], vert = this.targetVertices;
    for(let i = 0; i < vert.length; i += 9) {
      // ignore y coordinate
      let a = [vert[i], 0, vert[i + 2]];
      let b = [vert[i + 3], 0, vert[i + 5]];
      let c = [vert[i + 6], 0, vert[i + 8]];
      let color = colorFunction(a, b, c);
      for(let j = 0; j < 3; j++) {
        colors.push(color.r);
        colors.push(color.g);
        colors.push(color.b);
      }
    }
    this.colors = colors;
  }
}

export class ModifiedBox extends LowPolyGeometry {
  constructor(opt) {
    opt = opt || {};
    super(opt);
  }
  createVertices() {
    this.targetVertices = new Box({subdivisions: this.subdivisions}).getVertices();
    console.log(this.subdivisions);
  }
}

export class ModifiedTriangle extends ModifiedPlane {
  constructor(opt) {
    opt = opt || {};
    super(opt);
  }
  createVertices() {
    this.targetVertices = new Triangle({subdivisions: this.subdivisions}).getVertices();
  }
  
}

export class ModifiedSphere extends LowPolyGeometry {
  constructor(opt) {
    opt = opt || {};
    super(opt);
    
    this.subdivisions = opt.subdivisions || 0;
    this.normalizeVertices = true;
    this.setVertexHeight(() => 1);
  }
  createVertices() {
    this.targetVertices = new Icosahedron({subdivisions: this.subdivisions}).getVertices();
  }
}
