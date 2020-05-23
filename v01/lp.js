// color gradients
import { Color, Geometry, Vector3, PointsMaterial, Points, MeshStandardMaterial, Mesh, BufferGeometry, BufferAttribute } from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js';

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

const icosahedronInd = [5, 0, 11, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1];
const t = (1.0 + Math.sqrt(5)) / 2.0;
const icosahedronVer = [-1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0, 0, -1, t, 0,  1, t, 0, -1, -t, 0,  1, -t, t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1];

const planeVer = [1, 0, -1, -1, 0, -1, 1, 0,  1, 1, 0,  1, -1, 0, -1,  -1, 0,  1];
const boxVer = [-1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, -1, 1, -1, 1, -1, -1, 1, -1, 1, -1, 1, 1, 1, 1, 1, -1, 1, 1, 1, -1, 1, -1, -1, 1,  1, 1, 1, 1, 1, -1, -1, 1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, -1, -1, -1, -1, 1, 1, -1, 1, -1, -1, 1, 1, -1, -1, -1, -1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, 1, 1, 1, -1, -1, 1, 1, -1, 1, 1, 1, -1, -1, -1, -1, -1, 1, -1, -1, -1, -1, 1, 1, -1, 1, -1, -1,];

export class BaseObject {
  constructor() {
    this.vertices = [];
    this.subdivisions = 0;
  }
  
  getVertices() {
    return this.vertices;
  }
  
  subdivide(nums) {
    if(nums == 0) return; 
    
    let newVert = [];
    // go through each triangle 
    // (each containing 3 points with x, y and z)
    for(let j = 0; j < this.vertices.length; j += 9) {
      // split every triangle into four smaller triangles

      // get current triangle
      let a = [this.vertices[j], this.vertices[j + 1], this.vertices[j + 2]];
      let b = [this.vertices[j + 3], this.vertices[j + 4], this.vertices[j + 5]];
      let c = [this.vertices[j + 6], this.vertices[j + 7], this.vertices[j + 8]];
      
      let subTriangles = Helper.subdivideTriangle(a, b, c);
      Helper.addArrayToArray(newVert, subTriangles);
    }
    this.vertices = newVert;
    this.subdivisions += 1;
    return nums == undefined || nums < 2 ? this.subdivisions : this.subdivide(nums - 1);
  }
}

export class Icosahedron extends BaseObject {
  constructor(opt) {
    // create sorted vertices array, 
    // containing every triangle in the form 
    // [ax, ay, az, bx, by, bz, cx, cy, cz]
    super();
    opt = opt || {};
    
    this.vertices = Helper.createPerFaceVerticesFromIndices(icosahedronVer, icosahedronInd);
    if(opt.subdivisions) this.subdivide(opt.subdivisions);
  }
}

export class Plane extends BaseObject {
  constructor(opt) {
    super();
    opt = opt || {};
    
    for(let v of planeVer) this.vertices.push(v);
    
    if(opt.subdivisions) this.subdivide(opt.subdivisions);
  }
}

export class Pyramid extends BaseObject {
  constructor(opt) {
    super();
    opt = opt || {};
    
    this.sides = opt.sides != undefined && opt.sides > 2 ? opt.sides : 3;
    this.height = opt.height || 1;
    this.constructPyramid(this.sides, this.height);
    if(opt.includeBase) this.addPyramidBase(this.sides);
    
    if(opt.subdivisions) this.subdivide(opt.subdivisions);
  }
  constructPyramid(sides, height) {
    let vertices = [], lo = -height / 4, hi = height / 4 * 3;
    for(let i = 0; i < sides; i++) {
      let a1 = i / sides * Math.PI * 2;
      let a2 = (i + 1) / sides * Math.PI * 2;
      let v1 = Helper.vertexPosForAngle(a1, lo);
      let v2 = Helper.vertexPosForAngle(a2, lo);
      let v3 = [0, hi, 0];
      Helper.addTriangleToArray(vertices, [v1, v2, v3]);
    }
    this.vertices = vertices;
  }
  
  addPyramidBase(sides) {
    let lo = -this.height / 4;
    if(sides == 3) {
      let v1 = Helper.vertexPosForAngle(Math.PI * 4 / 3, lo);
      let v2 = Helper.vertexPosForAngle(Math.PI * 2 / 3, lo);
      let v3 = Helper.vertexPosForAngle(0, lo);
      Helper.addTriangleToArray(this.vertices, [v1, v2, v3]);
    } else if(sides == 4) {
      let v1 = Helper.vertexPosForAngle(Math.PI, lo);
      let v2 = Helper.vertexPosForAngle(Math.PI / 2, lo);
      let v3 = Helper.vertexPosForAngle(0, lo);
      let v4 = Helper.vertexPosForAngle(Math.PI / 2 * 3, lo);
      
      Helper.addTriangleToArray(this.vertices, [v1, v2, v3]);
      Helper.addTriangleToArray(this.vertices, [v4, v1, v3]);
    } else {
      console.log(sides + " sided pyramid bases not supported yet!");
    }
  }
}

export class Cylinder extends BaseObject {
  constructor(opt) {
    super();
    opt = opt || {};
    
    this.sides = opt.sides != undefined && opt.sides > 2 ? opt.sides : 3;
    this.rows = opt.rows || 1;
    this.height = opt.height || 1;
    this.constructCylinder(this.sides, this.height);
    
    if(opt.subdivisions) this.subdivide(opt.subdivisions);
  }
  constructCylinder(sides, height) {
    let vertices = [];
    for(let i = 0; i < sides; i++) {
      for(let r = 0; r < this.rows; r++) {
        let lo = -height / 2 + r / this.rows * height, hi = -height / 2 + (r + 1) / this.rows * height;
        let a1 = i / sides * Math.PI * 2;
        let a2 = (i + 1) / sides * Math.PI * 2;
        let v1 = Helper.vertexPosForAngle(a1, lo);
        let v2 = Helper.vertexPosForAngle(a2, lo);
        let v3 = Helper.vertexPosForAngle(a1, hi)
        let v4 = Helper.vertexPosForAngle(a2, hi);
        Helper.addTriangleToArray(vertices, [v1, v2, v3]);
        Helper.addTriangleToArray(vertices, [v3, v2, v4]);
      }
    }
    this.vertices = vertices;
  }
}

export class Triangle extends BaseObject {
  constructor(opt) {
    super();
    opt = opt || {};
    let v1 = Helper.vertexPosForAngle(0, 0);
    let v2 = Helper.vertexPosForAngle(Math.PI * 2 / 3, 0)
    let v3 = Helper.vertexPosForAngle(Math.PI * 4 / 3, 0);
    Helper.addTriangleToArray(this.vertices, [v1, v2, v3]);
    
    if(opt.subdivisions) this.subdivide(opt.subdivisions);
  }
}
export class Box extends BaseObject {
  constructor(opt) {
    super();
    opt = opt || {};
    
    for(let v of boxVer) this.vertices.push(v);
    
    if(opt.subdivisions) this.subdivide(opt.subdivisions);
  }
}