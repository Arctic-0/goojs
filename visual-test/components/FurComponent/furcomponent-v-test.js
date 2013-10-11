require.config({
	paths: {
		"goo": "../../../src/goo"
	}
});

require([
	'goo/loaders/DynamicLoader',
	'goo/entities/GooRunner',
	'goo/renderer/Camera',
	'goo/entities/components/CameraComponent',
	'goo/entities/components/ScriptComponent',
	'goo/scripts/MouseLookControlScript',
	'goo/scripts/WASDControlScript',
	'goo/renderer/pass/Composer',
	'goo/renderer/pass/RenderPass',
	'goo/renderer/pass/FurPass',
	'goo/shapes/ShapeCreator',
	'goo/entities/EntityUtils',
	'goo/renderer/Material',
	'goo/renderer/TextureCreator',
	'goo/renderer/shaders/ShaderLib',
	'goo/renderer/light/DirectionalLight',
	'goo/entities/components/LightComponent',
	'goo/math/Vector3'
],
function(
	DynamicLoader,
	GooRunner,
	Camera,
	CameraComponent,
	ScriptComponent,
	MouseLookControlScript,
	WASDControlScript,
	Composer,
	RenderPass,
	FurPass,
	ShapeCreator,
	EntityUtils,
	Material,
	TextureCreator,
	ShaderLib,
	DirectionalLight,
	LightComponent,
	Vector3
	) {
	"use strict";

	var resourcePath = "../../resources";

	var gui;

	function init() {
		var goo = new GooRunner({
			showStats: true,
			logo: "bottomleft"
		});
		goo.renderer.domElement.id = 'goo';
		document.body.appendChild(goo.renderer.domElement);

		gui = new window.dat.GUI();

		var light = new DirectionalLight();
		var lightEntity = goo.world.createEntity('light');
		lightEntity.setComponent(new LightComponent(light));
		lightEntity.transformComponent.transform.translation.set(0, 10, 5);
		lightEntity.transformComponent.transform.lookAt(Vector3.ZERO, Vector3.UNIT_Y);
		lightEntity.addToWorld();

		addFPSCamera(goo);

		var boxEntity = createBoxEntity(goo, 2);
		boxEntity.transformComponent.setTranslation(0,0,-3);
		boxEntity.meshRendererComponent.materials[0].materialState.ambient = [0.2, 0.2, 0.2, 1.0];
		boxEntity.addToWorld();

		createFurRenderingRoutine(goo);
	}

	function createBoxEntity(goo, size) {
		var meshData = ShapeCreator.createSphere(40, 40, size);
		var entity = EntityUtils.createTypicalEntity(goo.world, meshData);
		var material = Material.createMaterial(ShaderLib.texturedLit, 'BoxMaterial');
		TextureCreator.clearCache();
		var texture = new TextureCreator().loadTexture2D(resourcePath + '/check.png');
		material.setTexture('DIFFUSE_MAP', texture);
		entity.meshRendererComponent.materials.push(material);

		return entity;
	}

	function addFPSCamera(goo) {
		// Add camera
		var camera = new Camera(90, 1, 0.1, 1000);

		var cameraEntity = goo.world.createEntity('CameraEntity');

		cameraEntity.setComponent(new CameraComponent(camera));
		var cameraScript = new ScriptComponent();
		cameraScript.scripts.push(new WASDControlScript({
			domElement: document.body
		}));
		cameraScript.scripts.push(new MouseLookControlScript({
			domElement: document.body
		}));
		cameraEntity.setComponent(cameraScript);
		cameraEntity.addToWorld();
	}

	function loadModels(goo) {
		var loader = new DynamicLoader({
			world: goo.world,
			rootPath: "../../resources/models/LowPolyFighter/"
		});

		loader.load("project.project").then(function(){
			console.log("This is where the FurComponent is supposed to be added to the correct entity.");
		});

	}

	function createFurRenderingRoutine(goo) {

		var renderList = goo.world.getSystem('RenderSystem').renderList;
		var composer = new Composer();

		var regularPass = new RenderPass(renderList);
		regularPass.renderToScreen = true;

		// TODO: Add filter , to only render entities with FurComponents in the FurPass.
		var furPass = new FurPass(renderList);
		furPass.clear = false;

		var furFolder = gui.addFolder("Fur settings");
		furFolder.add(furPass.furUniforms, 'furRepeat', 1, 20);
		furFolder.add(furPass.furUniforms, 'hairLength', 0.05, 1);
		furFolder.add(furPass.furUniforms, 'curlFrequency', 0, 20);
		furFolder.add(furPass.furUniforms, 'curlRadius', -0.02, 0.02);
		furFolder.add(furPass.furUniforms, 'gravity', 0, 20.0);
		furFolder.add(furPass.furUniforms, 'sinusAmount', 0, 20.0);
		furFolder.open();

		composer.addPass(regularPass);
		composer.addPass(furPass);

		goo.world.getSystem('RenderSystem').composers.push(composer);
	}

	init();
});