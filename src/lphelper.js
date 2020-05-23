import { Color, Geometry, Vector3, PointsMaterial, Points, MeshStandardMaterial, Mesh, BufferGeometry, BufferAttribute } from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js';

export class Helper {
  static getArrayVertexLength(a) {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
  }

  static averageColor(a, b, c) {
    return new Color((a.r + b.r + c.r) / 3, (a.g + b.g + c.g) / 3, (a.b + b.b + c.b) / 3);
  }
  static getArrayVertexMidpoint(a, b) {
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  }
  static addTriangleToArray(toArr, triangle) {
    for(let vertex of triangle) {
      for(let coord of vertex) toArr.push(coord);
    }
  }
  static normalizeArrayVertex(a) {
    let l = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    if(l == 0) return; 
    a[0] /= l;
    a[1] /= l;
    a[2] /= l;
  }
  static createPerFaceVerticesFromIndices(ver, ind) {
    let vertices = [];
    for(let i = 0; i < ind.length; i++) {
      let vi = ind[i] * 3;
      vertices.push(ver[vi], ver[vi + 1], ver[vi + 2]);
    }
    return vertices;
  }
  
  static subdivideTriangle(a, b, c, vertexFunction) {
    let newTriangles = [];
    // get midpoint between points of triangle
    let d = Helper.getArrayVertexMidpoint(a, b);
    let e = Helper.getArrayVertexMidpoint(b, c);
    let f = Helper.getArrayVertexMidpoint(c, a);
    if(vertexFunction) {
      vertexFunction(d);
      vertexFunction(e);
      vertexFunction(f);
    }
    // add four new triangles using midpoints and orignal points
    Helper.addTriangleToArray(newTriangles, [a,d,f]);
    Helper.addTriangleToArray(newTriangles, [d,b,e]);
    Helper.addTriangleToArray(newTriangles, [e,c,f]);
    Helper.addTriangleToArray(newTriangles, [d,e,f]);
    return newTriangles;
  }
  
  static addArrayToArray(toArr, fromArr) {
    for(let i of fromArr) {
      toArr.push(i);
    }
  }

  static createStars(num, size, minDist, maxDist, colors) {
    var white = new Color("white");
    var stars = [];
    var starGeo = new Geometry();
    var starPos;
    
    for(let i = 0; i < num; i++) {
      starPos = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
      
      starPos.setLength(Math.random() * (maxDist - minDist) + minDist);
      starGeo.vertices.push(starPos);
      var colorI = Math.floor(Math.random() * colors.length);
      starGeo.colors.push(colors[colorI].clone().lerp(white, Math.random() + 0.5));
    }
    var starMaterial = new PointsMaterial({vertexColors: true, size: size, depthWrite: false});
    var mesh = new Points(starGeo, starMaterial);
    return mesh;
  }
  
  static meshWithStandardMat(geo) {
    return new Mesh(geo, new MeshStandardMaterial({vertexColors: true}))
  }
  
  static vertexPosForAngle(a, h) {
    return [Math.sin(a), h, Math.cos(a)];
  }
  static newBufferGeometry() {
    return new BufferGeometry();
  }
  static setGeometryAttribute(geo, name, data, num) {
    geo.setAttribute(name, new BufferAttribute(data, num));
  }
  
  static color(c) {
    return new Color(c);
  }
}
