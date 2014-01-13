define([
	'goo/renderer/ShaderCall',
	'goo/math/Matrix4x4',
	'goo/entities/World',
	'goo/renderer/RenderQueue',
	'goo/renderer/Util'
],
/** @lends */
function (
	ShaderCall,
	Matrix4x4,
	World,
	RenderQueue,
	Util
) {
	"use strict";

	var WebGLRenderingContext = window.WebGLRenderingContext;

	/**
	 * @class Defines vertex and fragment shader and uniforms to shader callbacks
	 * @param {String} name Shader name (mostly for debug/tool use)
	 * @param {ShaderDefinition} shaderDefinition Shader data
	 *
	 * <code>
	 * {
	 *    vshader : [required] vertex shader source
	 *    fshader : [required] fragment shader source
	 *    defines : shader definitions (becomes #define)
	 *    attributes : attribute bindings
	 *       attribute bindings need to map to an attribute in the meshdata being rendered
	 *    uniforms : uniform bindings
	 *       uniform bindings can be a value (like 2.5 or [1, 2]) or a function
	 * }
	 * </code>
	 */
	function Shader(name, shaderDefinition) {
		if (!shaderDefinition.vshader || !shaderDefinition.fshader) {
			throw new Error('Missing shader sources for shader: ' + name);
		}

		this.originalShaderDefinition = shaderDefinition;
		this.shaderDefinition = shaderDefinition;

		this.name = name;
		this.origVertexSource = shaderDefinition.vshader;
		this.origFragmentSource = shaderDefinition.fshader;
		this.vertexSource = typeof this.origVertexSource === 'function' ? this.origVertexSource() : this.origVertexSource;
		this.fragmentSource = typeof this.origFragmentSource === 'function' ? this.origFragmentSource() : this.origFragmentSource;


		this.shaderProgram = null;

		/**
		 * Attributes detected in the shader source code.
		 * Maps attribute variable's name to <code>{format: string}</code>
		 * @type {Object.<string, object>}}
		 */
		this.attributeMapping = {};

		/**
		 * Maps attribute variable's name to attribute location (from getAttribLocation).
		 * @type {Object.<string, number>}
		 */
		this.attributeIndexMapping = {};

		/**
		 * Uniforms detected in the shader source code.
		 * Maps variable name to <code>{format: string}</code>.
		 * @type {Object.<string, object>}
		 */
		this.uniformMapping = {};

		/**
		 * Maps uniform variable name to ShaderCall object.
		 * @type {Object.<string, ShaderCall>}
		 */
		this.uniformCallMapping = {};

		/**
		 * Texture slots detected in the shader source code.
		 * Will be an array of <code>{format: string, name: string}</code>
		 * @type {object[]}
		 */
		this.textureSlots = [];
		this.textureSlotsNaming = {};

		//this.defaultCallbacks = {};
		//setupDefaultCallbacks(this.defaultCallbacks);
		this.currentCallbacks = {};

		this.overridePrecision = shaderDefinition.precision || null;
		this.processors = shaderDefinition.processors;
		this.builder = shaderDefinition.builder;
		this.defines = shaderDefinition.defines;
		this.attributes = shaderDefinition.attributes || {};
		this.uniforms = shaderDefinition.uniforms || {};

		/** Determines the order in which an object is drawn. There are four pre-defined render queues:
		 *		<ul>
		 *			<li>RenderQueue.BACKGROUND = Rendered before any other objects. Commonly used for skyboxes and the likes (0-999)
		 *			<li>RenderQueue.OPAQUE = Used for most objects, typically opaque geometry. Rendered front to back (1000-1999)
		 *			<li>RenderQueue.TRANSPARENT = For all alpha-blended objects. Rendered back to front (2000-2999)
		 *			<li>RenderQueue.OVERLAY = For overlay effects like lens-flares etc (3000+)
		 *		</ul>
		 * By default materials use the render queue of the shader. See {@link RenderQueue} for more info
		 * @type {number}
		 */
		this.renderQueue = RenderQueue.OPAQUE;

		this._id = Shader.id++;

		this.errorOnce = false;
	}

	Shader.id = 0;

	Shader.prototype.clone = function () {
		return new Shader(this.name, Util.clone({
			precision: this.precision,
			processors: this.processors,
			builder: this.builder,
			defines: this.defines,
			attributes: this.attributes,
			uniforms: this.uniforms,
			vshader: this.origVertexSource,
			fshader: this.origFragmentSource
		}));

		// return new Shader(this.name, this.shaderDefinition);
	};

	Shader.prototype.cloneOriginal = function () {
		return new Shader(this.name, this.originalShaderDefinition);
	};

	/*
	 * Matches an attribute or uniform variable declaration.
	 *
	 * Match groups:
	 *
	 *   1: type (attribute|uniform)
	 *   2: format (float|int|bool|vec2|vec3|vec4|mat3|mat4|sampler2D|sampler3D|samplerCube)
	 *   3: variable name
	 *   4: if exists, the variable is an array
	 */
	var regExp = /\b(attribute|uniform)\s+(float|int|bool|vec2|vec3|vec4|mat3|mat4|sampler2D|sampler3D|samplerCube)\s+(\w+)(\s*\[\s*\w+\s*\])*;/g;

	Shader.prototype.apply = function (shaderInfo, renderer) {
		var context = renderer.context;
		var record = renderer.rendererRecord;

		if (this.shaderProgram === null) {
			this._investigateShaders();
			this.addDefines(this.defines);
			this.addPrecision(this.overridePrecision || renderer.shaderPrecision);
			this.compile(renderer);
		}

		// Set the ShaderProgram active
		var switchedProgram = false;
		if (record.usedProgram !== this.shaderProgram) {
			context.useProgram(this.shaderProgram);
			record.usedProgram = this.shaderProgram;
			switchedProgram = true;
		}

		// Bind attributes
		//TODO: good?
		if (this.attributes) {
		// if (this.attributes !== record.attributes || shaderInfo.meshData !== record.meshData) {
			// record.attributes = this.attributes;
			// record.meshData = shaderInfo.meshData;
			var attributeMap = shaderInfo.meshData.attributeMap;
			for (var key in this.attributes) {
				var attribute = attributeMap[this.attributes[key]];
				if (!attribute) {
					// TODO: log or what?
					continue;
				}

				var attributeIndex = this.attributeIndexMapping[key];
				if (attributeIndex === undefined) {
					// console.warn('Attribute binding [' + name + '] does not exist in the shader.');
					continue;
				}

				if (switchedProgram) {
					renderer.context.enableVertexAttribArray(attributeIndex);
				}
				renderer.bindVertexAttribute(attributeIndex, attribute);
			}
		}

		this._bindUniforms(shaderInfo);
	};

	Shader.prototype._bindUniforms = function (shaderInfo) {
		if (this.uniforms) {
			try {
				this.textureIndex = 0;
				var names = Object.keys(this.uniforms);
				for (var i = 0, l = names.length; i < l; i++) {
					this._bindUniform(names[i], shaderInfo);
				}
				this.errorOnce = false;
			} catch (err) {
				if (this.errorOnce === false) {
					console.error(err.stack);
					this.errorOnce = true;
				}
			}
		}
	};

	Shader.prototype._bindUniform = function (name, shaderInfo) {
		var mapping = this.uniformCallMapping[name];
		if (mapping === undefined) {
			// console.warn('Uniform binding [' + name + '] does not exist in the shader.');
			return;
		}
		var defValue = (shaderInfo.material.uniforms[name] !== undefined) ? shaderInfo.material.uniforms[name] : this.uniforms[name];

		if (typeof defValue === 'string') {
			var callback = this.currentCallbacks[name];
			if (callback) {
				callback(mapping, shaderInfo);
			} else {
				var slot = this.textureSlotsNaming[name];
				if (slot !== undefined) {
					var maps = shaderInfo.material.getTexture(slot.mapping);
					if (maps instanceof Array) {
						var arr = [];
						slot.index = [];
						for (var i = 0; i < maps.length; i++) {
							slot.index.push(this.textureIndex);
							arr.push(this.textureIndex++);
						}
						mapping.call(arr);
					} else {
						slot.index = this.textureIndex;
						mapping.call(this.textureIndex++);
					}
				}
			}
		} else {
			var value = typeof defValue === 'function' ? defValue(shaderInfo) : defValue;
			mapping.call(value);
		}
	};

	Shader.prototype.rebuild = function () {
		this.shaderProgram = null;
		this.attributeMapping = {};
		this.attributeIndexMapping = {};
		this.uniformMapping = {};
		this.uniformCallMapping = {};
		this.currentCallbacks = {};
		this.vertexSource = typeof this.origVertexSource === 'function' ? this.origVertexSource() : this.origVertexSource;
		this.fragmentSource = typeof this.origFragmentSource === 'function' ? this.origFragmentSource() : this.origFragmentSource;
	};

	Shader.prototype._investigateShaders = function () {
		this.textureSlots = [];
		this.textureSlotsNaming = {};
		Shader.investigateShader(this.vertexSource, this);
		Shader.investigateShader(this.fragmentSource, this);
	};

	/**
	 * Extract shader variable definitions from shader source code.
	 * @static
	 * @param {string} source The source code.
	 * @param {object} target
	 * @param {object} target.attributeMapping
	 * @param {object} target.uniformMapping
	 * @param {object[]} target.textureSlots
	 */
	Shader.investigateShader = function (source, target) {
		regExp.lastIndex = 0;
		var matcher = regExp.exec(source);

		while (matcher !== null) {
			var definition = {
				// data type: float, int, ...
				format: matcher[2]
			};
			var type = matcher[1];  // "attribute" or "uniform"
			var variableName = matcher[3];
			var arrayDeclaration = matcher[4];
			if (arrayDeclaration) {
				if (definition.format === 'float') {
					definition.format = 'floatarray';
				} else if (definition.format === 'int') {
					definition.format = 'intarray';
				} else if (definition.format.indexOf("sampler") === 0) {
					definition.format = 'samplerArray';
				}
			}

			if ("attribute" === type) {
				target.attributeMapping[variableName] = definition;
			} else {
				if (definition.format.indexOf("sampler") === 0) {
					var textureSlot = {
						format: definition.format,
						name: variableName,
						mapping: target.uniforms[variableName],
						index: target.textureSlots.length
					};
					target.textureSlots.push(textureSlot);
					target.textureSlotsNaming[textureSlot.name] = textureSlot;
				}
				target.uniformMapping[variableName] = definition;
			}

			matcher = regExp.exec(source);
		}
	};

	Shader.prototype.compile = function (renderer) {
		var context = renderer.context;

		// console.log('---------------------- vertex: '+ this.name +' --------------------------');
		// console.log(this.vertexSource);
		// console.log('---------------------- fragment: '+ this.name +' --------------------------');
		// console.log(this.fragmentSource);

		var vertexShader = this._getShader(context, WebGLRenderingContext.VERTEX_SHADER, this.vertexSource);
		var fragmentShader = this._getShader(context, WebGLRenderingContext.FRAGMENT_SHADER, this.fragmentSource);

		if (vertexShader === null || fragmentShader === null) {
			console.error("Shader error - no shaders");
		}

		this.shaderProgram = context.createProgram();
		var error = context.getError();
		if (this.shaderProgram === null || error !== WebGLRenderingContext.NO_ERROR) {
			console.error("Shader error: " + error + " [shader: " + this.name + "]");
		}

		context.attachShader(this.shaderProgram, vertexShader);
		context.attachShader(this.shaderProgram, fragmentShader);

		// Link the Shader Program
		context.linkProgram(this.shaderProgram);
		if (!context.getProgramParameter(this.shaderProgram, WebGLRenderingContext.LINK_STATUS)) {
			console.error("Could not initialise shaders: " + context.getProgramInfoLog(this.shaderProgram));
		}

		for (var key in this.attributeMapping) {
			var attributeIndex = context.getAttribLocation(this.shaderProgram, key);
			if (attributeIndex === -1) {
				// if (this.attributes[key]) {
					// delete this.attributes[key];
				// }
				// console.warn('Attribute [' + this.attributeMapping[key].format + ' ' + key + '] variable not found in shader. Probably unused and optimized away.');
				continue;
			}

			this.attributeIndexMapping[key] = attributeIndex;
		}

		for (var key in this.uniformMapping) {
			var uniform = context.getUniformLocation(this.shaderProgram, key);

			if (uniform === null) {
				// if (this.uniforms[key]) {
					// delete this.uniforms[key];
				// }

				var l = this.textureSlots.length;
				for (var i = 0; i < l; i++) {
					var slot = this.textureSlots[i];
					if (slot.name === key) {
						this.textureSlots.splice(i, 1);
						delete this.textureSlotsNaming[slot.name];
						for (; i < l-1; i++) {
							this.textureSlots[i].index--;
						}
						break;
					}
				}
				// console.warn('Uniform [' + this.uniformMapping[key].format + ' ' + key + '] variable not found in shader. Probably unused and optimized away.');
				continue;
			}

			this.uniformCallMapping[key] = new ShaderCall(context, uniform, this.uniformMapping[key].format);
		}

		// if (this.attributes) {
		// 	for (var name in this.attributeIndexMapping) {
		// 		var mapping = this.attributes[name];
		// 		if (mapping === undefined) {
		// 			console.warn('No binding found for attribute: ' + name + ' [' + this.name + '][' + this._id + ']');
		// 		}
		// 	}
		// }

		if (this.uniforms) {
			// Fix links ($link)
			if (this.uniforms.$link) {
				var links = this.uniforms.$link instanceof Array ? this.uniforms.$link : [this.uniforms.$link];
				for (var i = 0; i < links.length; i++) {
					var link = links[i];
					for (var key in link) {
						this.uniforms[key] = link[key];
					}
				}
				delete this.uniforms.$link;
			}

			for (var name in this.uniforms) {
				// var mapping = this.uniformCallMapping[name];
				// if (mapping === undefined) {
					// console.warn('No uniform found for binding: ' + name + ' [' + this.name + '][' + this._id + ']');
				// }

				var value = this.uniforms[name];
				if (this.defaultCallbacks[value]) {
					this.currentCallbacks[name] = this.defaultCallbacks[value];
				}
			}
			// for (var name in this.uniformCallMapping) {
				// var mapping = this.uniforms[name];
				// if (mapping === undefined) {
					// console.warn('No binding found for uniform: ' + name + ' [' + this.name + '][' + this._id + ']');
				// }
			// }
		}

		//console.log('Shader [' + this.name + '][' + this._id + '] compiled');
	};

	var errorRegExp = /\b\d+:(\d+):\s(.+)\b/g;
	var errorRegExpIE = /\((\d+),\s*\d+\):\s(.+)/g;

	Shader.prototype._getShader = function (context, type, source) {
		var shader = context.createShader(type);

		context.shaderSource(shader, source);
		context.compileShader(shader);

		// check if the Shader is successfully compiled
		if (!context.getShaderParameter(shader, WebGLRenderingContext.COMPILE_STATUS)) {
			var infoLog = context.getShaderInfoLog(shader);
			var shaderType = type === WebGLRenderingContext.VERTEX_SHADER ? 'VertexShader' : 'FragmentShader';

			errorRegExp.lastIndex = 0;
			var errorMatcher = errorRegExp.exec(infoLog);
			if (errorMatcher === null) {
				errorMatcher = errorRegExpIE.exec(infoLog);
			}
			if (errorMatcher !== null) {
				while (errorMatcher !== null) {
					var splitSource = source.split('\n');
					var lineNum = errorMatcher[1];
					var errorStr = errorMatcher[2];
					console.error('Error in ' + shaderType + ' - [' + this.name + '][' + this._id + '] at line ' + lineNum + ':');
					console.error('\tError: ' + errorStr);
					console.error('\tSource: ' + splitSource[lineNum - 1]);
					errorMatcher = errorRegExp.exec(infoLog);
				}
			} else {
				console.error('Error in ' + shaderType + ' - [' + this.name + '][' + this._id + '] ' + infoLog);
			}

			return null;
		}

		return shader;
	};

	var precisionRegExp = /\bprecision\s+(lowp|mediump|highp)\s+(float|int);/g;

	Shader.prototype.addPrecision = function (precision) {
		precisionRegExp.lastIndex = 0;
		var vertMatcher = precisionRegExp.exec(this.vertexSource);
		if (vertMatcher === null) {
			this.vertexSource = 'precision ' + precision + ' float;' + '\n' + this.vertexSource;
		}
		precisionRegExp.lastIndex = 0;
		var fragMatcher = precisionRegExp.exec(this.fragmentSource);
		if (fragMatcher === null) {
			this.fragmentSource = 'precision ' + precision + ' float;' + '\n' + this.fragmentSource;
		}
	};

	Shader.prototype.addDefines = function (defines) {
		if (!defines) {
			return;
		}

		var defineStr = this.generateDefines(defines);

		this.vertexSource = defineStr + '\n' + this.vertexSource;
		this.fragmentSource = defineStr + '\n' + this.fragmentSource;
	};

	Shader.prototype.generateDefines = function (defines) {
		var chunks = [];
		for (var d in defines) {
			var value = defines[d];
			if (value === false) {
				continue;
			}

			var chunk = '#define ' + d + ' ' + value;
			chunks.push(chunk);
		}

		return chunks.join('\n');
	};

	function setupDefaultCallbacks(defaultCallbacks) {
		var IDENTITY_MATRIX = new Matrix4x4();
		var tmpMatrix = new Matrix4x4();

		defaultCallbacks[Shader.PROJECTION_MATRIX] = function (uniformCall, shaderInfo) {
			var matrix = shaderInfo.camera.getProjectionMatrix();
			uniformCall.uniformMatrix4fv(matrix);
		};
		defaultCallbacks[Shader.VIEW_MATRIX] = function (uniformCall, shaderInfo) {
			var matrix = shaderInfo.camera.getViewMatrix();
			uniformCall.uniformMatrix4fv(matrix);
		};
		defaultCallbacks[Shader.WORLD_MATRIX] = function (uniformCall, shaderInfo) {
			var matrix = shaderInfo.transform !== undefined ? shaderInfo.transform.matrix : IDENTITY_MATRIX;
			uniformCall.uniformMatrix4fv(matrix);
		};
		defaultCallbacks[Shader.NORMAL_MATRIX] = function (uniformCall, shaderInfo) {
			var matrix = shaderInfo.transform !== undefined ? shaderInfo.transform.matrix : IDENTITY_MATRIX;
			Matrix4x4.invert(matrix, tmpMatrix);
			Matrix4x4.transpose(tmpMatrix, tmpMatrix);
			uniformCall.uniformMatrix4fv(tmpMatrix);
		};

		defaultCallbacks[Shader.VIEW_INVERSE_MATRIX] = function (uniformCall, shaderInfo) {
			var matrix = shaderInfo.camera.getViewInverseMatrix();
			uniformCall.uniformMatrix4fv(matrix);
		};
		defaultCallbacks[Shader.VIEW_PROJECTION_MATRIX] = function (uniformCall, shaderInfo) {
			var matrix = shaderInfo.camera.getViewProjectionMatrix();
			uniformCall.uniformMatrix4fv(matrix);
		};
		defaultCallbacks[Shader.VIEW_PROJECTION_INVERSE_MATRIX] = function (uniformCall, shaderInfo) {
			var matrix = shaderInfo.camera.getViewProjectionInverseMatrix();
			uniformCall.uniformMatrix4fv(matrix);
		};

		for (var i = 0; i < 16; i++) {
			/*jshint loopfunc: true */
			defaultCallbacks[Shader['TEXTURE' + i]] = (function (i) {
				return function (uniformCall) {
					uniformCall.uniform1i(i);
				};
			})(i);
		}

		for (var i = 0; i < 8; i++) {
			/*jshint loopfunc: true */
			defaultCallbacks[Shader['LIGHT' + i]] = (function (i) {
				return function (uniformCall, shaderInfo) {
					var light = shaderInfo.lights[i];
					if (light !== undefined) {
						uniformCall.uniform3f(light.translation.data[0], light.translation.data[1], light.translation.data[2]);
					} else {
						uniformCall.uniform3f(-20, 20, 20);
					}
				};
			})(i);
		}
		defaultCallbacks[Shader.LIGHTCOUNT] = function (uniformCall, shaderInfo) {
			uniformCall.uniform1i(shaderInfo.lights.length);
		};

		defaultCallbacks[Shader.CAMERA] = function (uniformCall, shaderInfo) {
			var cameraPosition = shaderInfo.camera.translation;
			uniformCall.uniform3f(cameraPosition.data[0], cameraPosition.data[1], cameraPosition.data[2]);
		};
		defaultCallbacks[Shader.NEAR_PLANE] = function (uniformCall, shaderInfo) {
			uniformCall.uniform1f(shaderInfo.camera.near);
		};
		defaultCallbacks[Shader.FAR_PLANE] = function (uniformCall, shaderInfo) {
			uniformCall.uniform1f(shaderInfo.camera.far);
		};
		defaultCallbacks[Shader.MAIN_NEAR_PLANE] = function (uniformCall, shaderInfo) {
			uniformCall.uniform1f(shaderInfo.mainCamera.near);
		};
		defaultCallbacks[Shader.MAIN_FAR_PLANE] = function (uniformCall, shaderInfo) {
			uniformCall.uniform1f(shaderInfo.mainCamera.far);
		};
		defaultCallbacks[Shader.MAIN_DEPTH_SCALE] = function (uniformCall, shaderInfo) {
			uniformCall.uniform1f(1.0 / (shaderInfo.mainCamera.far - shaderInfo.mainCamera.near));
		};


		defaultCallbacks[Shader.AMBIENT] = function (uniformCall, shaderInfo) {
			var materialState = shaderInfo.material.materialState !== undefined ? shaderInfo.material.materialState.ambient : Shader.DEFAULT_AMBIENT;
			uniformCall.uniform4fv(materialState);
		};
		defaultCallbacks[Shader.EMISSIVE] = function (uniformCall, shaderInfo) {
			var materialState = shaderInfo.material.materialState !== undefined ? shaderInfo.material.materialState.emissive : Shader.DEFAULT_EMISSIVE;
			uniformCall.uniform4fv(materialState);
		};
		defaultCallbacks[Shader.DIFFUSE] = function (uniformCall, shaderInfo) {
			var materialState = shaderInfo.material.materialState !== undefined ? shaderInfo.material.materialState.diffuse : Shader.DEFAULT_DIFFUSE;
			uniformCall.uniform4fv(materialState);
		};
		defaultCallbacks[Shader.SPECULAR] = function (uniformCall, shaderInfo) {
			var materialState = shaderInfo.material.materialState !== undefined ? shaderInfo.material.materialState.specular : Shader.DEFAULT_SPECULAR;
			uniformCall.uniform4fv(materialState);
		};
		defaultCallbacks[Shader.SPECULAR_POWER] = function (uniformCall, shaderInfo) {
			var shininess = shaderInfo.material.materialState !== undefined ? shaderInfo.material.materialState.shininess : Shader.DEFAULT_SHININESS;
			shininess = Math.max(shininess, 1.0);
			uniformCall.uniform1f(shininess);
		};

		defaultCallbacks[Shader.TIME] = function (uniformCall) {
			uniformCall.uniform1f(World.time);
		};
		defaultCallbacks[Shader.TPF] = function (uniformCall) {
			uniformCall.uniform1f(World.tpf);
		};

		defaultCallbacks[Shader.RESOLUTION] = function (uniformCall, shaderInfo) {
			uniformCall.uniform2f(shaderInfo.renderer.viewportWidth, shaderInfo.renderer.viewportHeight);
		};
	}

	Shader.prototype.getShaderDefinition = function () {
		return {
			vshader: this.vertexSource,
			fshader: this.fragmentSource,
			defines: this.defines,
			attributes: this.attributes,
			uniforms: this.uniforms
		};
	};

	Shader.prototype.toString = function () {
		return this.name;
	};

	Shader.PROJECTION_MATRIX = 'PROJECTION_MATRIX';
	Shader.VIEW_MATRIX = 'VIEW_MATRIX';
	Shader.VIEW_INVERSE_MATRIX = 'VIEW_INVERSE_MATRIX';
	Shader.VIEW_PROJECTION_MATRIX = 'VIEW_PROJECTION_MATRIX';
	Shader.VIEW_PROJECTION_INVERSE_MATRIX = 'VIEW_PROJECTION_INVERSE_MATRIX';
	Shader.WORLD_MATRIX = 'WORLD_MATRIX';
	Shader.NORMAL_MATRIX = 'NORMAL_MATRIX';
	for (var i = 0; i < 8; i++) {
		Shader['LIGHT' + i] = 'LIGHT' + i;
	}
	Shader.CAMERA = 'CAMERA';
	Shader.AMBIENT = 'AMBIENT';
	Shader.EMISSIVE = 'EMISSIVE';
	Shader.DIFFUSE = 'DIFFUSE';
	Shader.SPECULAR = 'SPECULAR';
	Shader.SPECULAR_POWER = 'SPECULAR_POWER';
	Shader.NEAR_PLANE = 'NEAR_PLANE';
	Shader.FAR_PLANE = 'FAR_PLANE';
	Shader.MAIN_NEAR_PLANE = 'NEAR_PLANE';
	Shader.MAIN_FAR_PLANE = 'FAR_PLANE';
	Shader.MAIN_DEPTH_SCALE = 'DEPTH_SCALE';
	Shader.TIME = 'TIME';
	Shader.TPF = 'TPF';
	Shader.RESOLUTION = 'RESOLUTION';

	Shader.DIFFUSE_MAP = 'DIFFUSE_MAP';
	Shader.NORMAL_MAP = 'NORMAL_MAP';
	Shader.SPECULAR_MAP = 'SPECULAR_MAP';
	Shader.LIGHT_MAP = 'LIGHT_MAP';
	Shader.SHADOW_MAP = 'SHADOW_MAP';
	Shader.AO_MAP = 'AO_MAP';
	Shader.EMISSIVE_MAP = 'EMISSIVE_MAP';
	Shader.DEPTH_MAP = 'DEPTH_MAP';

	Shader.DEFAULT_AMBIENT = [0.1, 0.1, 0.1, 1.0];
	Shader.DEFAULT_EMISSIVE = [0, 0, 0, 0];
	Shader.DEFAULT_DIFFUSE = [0.8, 0.8, 0.8, 1.0];
	Shader.DEFAULT_SPECULAR = [0.6, 0.6, 0.6, 1.0];
	Shader.DEFAULT_SHININESS = 64.0;

	Shader.prototype.defaultCallbacks = {};
	setupDefaultCallbacks(Shader.prototype.defaultCallbacks);

	return Shader;
});
