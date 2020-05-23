import { Helper } from './lphelper.js'

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