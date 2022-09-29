import { DoubleSide, PointLight, FloatType, Scene, PerspectiveCamera, WebGLRenderer, Color, ACESFilmicToneMapping, 
        sRGBEncoding, Mesh, SphereGeometry, MeshBasicMaterial, PMREMGenerator, Sphere, MeshStandardMaterial, 
        BoxGeometry, CylinderGeometry, Vector2, TextureLoader, MeshPhysicalMaterial, PCFShadowMap, TetrahedronGeometry, MeshPhongMaterial, } from 'https://cdn.skypack.dev/three@0.137';
import { RGBELoader } from 'http://cdn.skypack.dev/three-stdlib@2.8.5/loaders/RGBELoader';
import { OrbitControls } from 'https://cdn.skypack.dev/three-stdlib@2.8.5/controls/OrbitControls';
import { mergeBufferGeometries } from 'https://cdn.skypack.dev/three-stdlib@2.8.5/utils/BufferGeometryUtils';
import SimplexNoise from 'https://cdn.skypack.dev/simplex-noise@3.0.0';




//firstly, in order for certain geometries, or features such as random noise mapping, camera position features etc. 
//we need to load in specific classes, which you can find on the three.js website under docs
//https://threejs.org/docs/index.html#manual/en/introduction/Creating-a-scene
//this will allow us to bring in a vast combination of features to play around with

const scene = new Scene();
scene.background = new Color("#eadbea");

const camera = new PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(-28, 31, 33);
// camera.position.set(0, 0, 50);

const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = ACESFilmicToneMapping;
renderer.outputEncoding = sRGBEncoding;
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFShadowMap;
document.body.appendChild(renderer.domElement);

const light = new PointLight( new Color("#FFCB8E").convertSRGBToLinear().convertSRGBToLinear(), 80, 200 ); 
//makes the colour vibrant by repeating the same function as it overlaps to intensify the given colour.
light.position.set(10, 20, 10);

light.castShadow = true; 
light.shadow.mapSize.width = 512; //changes resolution
light.shadow.mapSize.height = 512; 
light.shadow.camera.near = 0.5; 
light.shadow.camera.far = 500; 
scene.add( light );

//brings in an external package to allow for drag interactive elements
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.dampingFactor = 0.05;
controls.enableDamping = true;

let envmap;

//https://stackoverflow.com/questions/15248872/dynamically-create-2d-text-in-three-js
var text2 = document.createElement('div');
text2.style.position = 'absolute';
text2.style.fontFamily = 'Courier New';
//text2.style.zIndex = 1;  
text2.style.width = 100;
text2.style.height = 100;
text2.innerHTML = "hi there, hit <b>refresh</b> for a new scene! <br> <br> <b>click + drag/zoom</b>";
text2.style.top = 25 + 'px';
text2.style.left = 25 + 'px';
document.body.appendChild(text2);



(async function() {
    let pmrem = new PMREMGenerator(renderer);
    let envmapTexture = await new RGBELoader().setDataType(FloatType).loadAsync("assets/envmap.hdr");
    envmap = pmrem.fromEquirectangular(envmapTexture).texture;

    let textures = {
        dirt: await new TextureLoader().loadAsync("assets/dirt.png"),
        dirt2: await new TextureLoader().loadAsync("assets/sand.jpg"),
        grass: await new TextureLoader().loadAsync("assets/grass.jpg"),
        sand: await new TextureLoader().loadAsync("assets/dirt2.png"),
        water: await new TextureLoader().loadAsync("assets/water.jpg"),
        stone: await new TextureLoader().loadAsync("assets/stone.png"),
        grass1: await new TextureLoader().loadAsync("assets/grass1.png"),
        grass2: await new TextureLoader().loadAsync("assets/grass2.png"),
      };

    const simplex = new SimplexNoise();

//with this call below, we are making a hexagon geometry 3 units tall in its position of the center of the scene.
//we will then add multiple instances of a hexagon geometry programmatically with a 'for loop'
    
    for(let i = -15; i < 15; i++) { //these variables control the amount of hexagons shown in the scene
        for(let j = -15; j < 15; j++) { 
            let position = tileToPosition(i, j);
            
            //the distance is calculated from the center of the scene. We are calculating "position.length" and how long
            //it's going to span. It can be considered as the radius. If the number of hexagons goes outside the radius,
            // the tiles outside of the radius, above 16 counts, will be nulled.

            if(position.length() > 16) continue; //tldr this if function controls the radius of hexagons

            //the SimplexNoise function - 

            let noise = (simplex.noise2D(i * 0.1, j * 0.1) + 1) * 0.5;
            noise = Math.pow(noise, 1.3); //creates how high the mountain peaks rise

            makeHex(noise * MAX_HEIGHT, position);
        }
    }

    //"makeHex" will populate the geometries "stoneGeo, grassGeo etc.", these geometries will be used with the "hexMesh"
    //function, and the texture to create mesh, that gets added to the scene. 

    let stoneMesh = hexMesh(stoneGeo, textures.stone);
    let grassMesh = hexMesh(grassGeo, textures.grass);
    let grass1Mesh = hexMesh(grass1Geo, textures.grass1);
    let grass2Mesh = hexMesh(grass2Geo, textures.grass2);
    let dirt2Mesh = hexMesh(dirt2Geo, textures.dirt2);
    let dirtMesh = hexMesh(dirtGeo, textures.dirt);
    let sandMesh = hexMesh(sandGeo, textures.sand);
    scene.add(stoneMesh, dirtMesh, dirt2Mesh, sandMesh, grassMesh, grass1Mesh, grass2Mesh);


    //here we're using a cylinder to render and model in the geometry of the water texture. MAX_HEIGHT * 0.2 refers to 
    //how high the water texture extrude up, in this case it will rise 20% of the maximum height of the scene.

    let seaMesh = new Mesh(
        new CylinderGeometry(18.5, 18.5, MAX_HEIGHT * 0.2, 50),
        new MeshPhysicalMaterial({
          envMap: envmap,
          color: new Color("#55aaff").convertSRGBToLinear().multiplyScalar(3),
          //by enabling transmission and transparency, we can render in glass like textures. ior = index of refraction.
          ior: 1.4,
          transmission: 1,
          transparent: true,
          thickness: 1.5,
          envMapIntensity: 0.2, 
          roughness: 1,
          metalness: 0.025,
          roughnessMap: textures.water,
          metalnessMap: textures.water,
        })
      );
      seaMesh.receiveShadow = true;
      seaMesh.position.set(0, MAX_HEIGHT * 0.1, 0);
      scene.add(seaMesh);



      let mapFloor = new Mesh(
        new CylinderGeometry(19.5, 19.5, MAX_HEIGHT * 0.2, 50),
        new MeshPhysicalMaterial({
          envMap: envmap,
          map: textures.dirt2,
          envMapIntensity: 0.1, 
          side: DoubleSide,
        })
      );
      mapFloor.receiveShadow = true;
      mapFloor.position.set(0, -MAX_HEIGHT * 0.05, 0);
      scene.add(mapFloor);

      let dome = new Mesh(
         new SphereGeometry(19, 32, 16, 0, 6.28, 0, 1.67),
         new MeshPhysicalMaterial({
          envMap: envmap,
          color: new Color("#fefdfd"),
          ior: 1,
          transmission: 1,
          depthTest: true,
          depthWrite: false,
          transparent: true,
          opacity: 0.4,
          thickness: 0.1,
          envMapIntensity: 0, 
          roughness: 0,
          metalness: 0.025,
          roughnessMap: textures.water,
          metalnessMap: textures.water,
      })
    );
    
    dome.receiveShadow = true;
    dome.position.set(0, 0, 0);
    scene.add(dome);

    renderer.setAnimationLoop(() => {
        controls.update();
        renderer.render(scene, camera);
      });
    })();

//this is going to convert our i and j variable, which will be passed down to parameters to a real world
//vector which is going to position the hexagon on the 3D scene. -- this creates a grid system that spaces out
//each hexagon correctly, giving them spaces in between each other, without the below function, the hexagons
//will look like they're clumped up together.

function tileToPosition(tileX, tileY) {
    return new Vector2((tileX +(tileY % 2) * 0.5) * 1.77, tileY * 1.535); 
    //this creates the offset for each row of hexagons to create a honeycomb effect
}

const MAX_HEIGHT = 10;
const STONE_HEIGHT = MAX_HEIGHT * 0.8;
const DIRT_HEIGHT = MAX_HEIGHT * 0.7;
const GRASS_HEIGHT = MAX_HEIGHT * 0.5;
const SAND_HEIGHT = MAX_HEIGHT * 0.3;
const DIRT2_HEIGHT = MAX_HEIGHT * 0;

let stoneGeo = new BoxGeometry(0, 0, 0);
let dirtGeo = new BoxGeometry(0, 0, 0);
let dirt2Geo = new BoxGeometry(0, 0, 0);
let sandGeo = new BoxGeometry(0, 0, 0);
let grassGeo = new BoxGeometry(0, 0, 0);
let grass1Geo = new BoxGeometry(0, 0, 0);
let grass2Geo = new BoxGeometry(0, 0, 0);

//here we can manipulate the cylinder geometry to create custom shapes, in this case, hexagons
//Each type of hexagon will have it's own geometry category, in which we're now able to create different layers
//with different textures mapped onto them.

function hexGeometry(height, position) {
    let geo = new CylinderGeometry(1, 1, height, 6, 1, false); 
    //this cylinder will have 6 sides, which gives the impression that it's a hexagon
    geo.translate(position.x, height * 0.5, position.y);

    return geo;
}

//we want to avoid a seperate draw call for each mesh, so above we want to make a single mesh to contain all of the geometries for all the hexagons
//we have this function here, "hexagonGeometries" to combine all of the hexagon geometries we're going to render, into one single function, calling
//for the "mergeBufferGeometries" function. Each time we call "makeHex", we create new geometries on top of "hexagonGeometries".
//To sum up, this code will eliminate the problem of having hundreds of seperate hexagon geometries which will hinder the webpage.

function makeHex(height, position) {
    let geo = hexGeometry(height, position);
    
    if(height > STONE_HEIGHT) {
        stoneGeo = mergeBufferGeometries([geo, stoneGeo]);
        //here we can control where our models we made below reside, for example this house model is situated in the stone
        //cylinder height categories, meaning they will only appear on the stone geometry. Trees will appear on the dirt and grass
        //cylinder height categories as shown below
        if(Math.random() > 0.8) { 
            dirt2Geo = mergeBufferGeometries([dirt2Geo, house(height, position)]);
          }
    } else if(height > DIRT_HEIGHT) {
        dirtGeo = mergeBufferGeometries([geo, dirtGeo]);
        if(Math.random() > 0.9) { 
            grassGeo = mergeBufferGeometries([grassGeo, tree(height, position)]);
          } 
    } else if(height > GRASS_HEIGHT) {
        grass1Geo = mergeBufferGeometries([geo, grass1Geo]);
        if(Math.random() > 0.8) { 
            grassGeo = mergeBufferGeometries([grassGeo, tree(height, position)]);
          } 
          if(Math.random() > 0.9) { 
            dirt2Geo = mergeBufferGeometries([dirt2Geo, house(height, position)]);
          }
    } else if(height > SAND_HEIGHT) {
        sandGeo = mergeBufferGeometries([geo, sandGeo]);
        if(Math.random() > 0.98) { 
          grassGeo = mergeBufferGeometries([grassGeo, tree2(height, position)]);
        }
    } else if(height > DIRT2_HEIGHT) {
        dirt2Geo = mergeBufferGeometries([geo, dirt2Geo]);
        
    }
}

function hexMesh(geo, map) {
    let mat = new MeshPhysicalMaterial({
        envMap: envmap,
        envMapIntensity: 0.135,
        flatShading: true,
        map
    });

    let mesh = new Mesh(geo, mat);
    mesh.castShadow = true; //default is false
    mesh.receiveShadow = true; //default

    return mesh;
}

function tree(height, position) {
    const treeHeight = Math.random() * 1 + 1.25;
  //here were stacking 4 different geometries, shaped like pyramids, to create a basic tree model, "mergeBufferGeometries" will create
  //stack these geometries accordingly. 
    const geo4 = new CylinderGeometry(0, 0.2, treeHeight, 3);
    geo4.translate(position.x, height + treeHeight * -0.1 + 1, position.y);

    const geo = new CylinderGeometry(0, 1.5, treeHeight, 3);
    geo.translate(position.x, height + treeHeight * 0.3 + 1, position.y);
    
    const geo2 = new CylinderGeometry(0, 1.3, treeHeight, 3);
    geo2.translate(position.x, height + treeHeight * 0.6 + 1, position.y);
    
    const geo3 = new CylinderGeometry(0, 0.8, treeHeight, 3.1);
    geo3.translate(position.x, height + treeHeight * 1.25 + 1, position.y);
  
    return mergeBufferGeometries([geo, geo2, geo3, geo4]);
  }

//here we can manipulate and combine different shaped geometries by changing their contructor properties, here I am stacking a box geometry
//with a 4 sided cylinder to create a simple house model.

  function house(height, position) {
    const px = Math.random() * 0;
    const pz = Math.random() * 0;
    const houseHeight = 1 * 1.2;
  
    const house = new BoxGeometry(0.9, 1.7, 1); //width, height, depth
    house.translate(position.x + px, height, position.y + pz);

    const geo3 = new CylinderGeometry(0, 0.9, 0.7, 4, 1, false, 0.8); //radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, rotation
    geo3.translate(position.x, height + houseHeight, position.y);

    return mergeBufferGeometries([house, geo3]);
  }

//variation of the tree above, replaced 2 of the pyramid geometries as spheres and kept the branch.
function tree2(height, position) {
  const treeHeight = Math.random() * 1 + 1;
 
  const geo4= new CylinderGeometry(0, 0.2, treeHeight, 3);
  geo4.translate(position.x, height + treeHeight * -0.1 + 1, position.y);

  const puff1 = new SphereGeometry(0.8, 6, 7);
  puff1.translate(position.x, height + treeHeight * 0.3 + 1, position.y);
  
  const puff2 = new SphereGeometry(0.55, 7, 7);
  puff2.translate(position.x + 0.5, height + treeHeight * 1 + 0.4, position.y);
  
  return mergeBufferGeometries([puff1, puff2, geo4]);
}


