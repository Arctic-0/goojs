define(
	[
		'goo/logic/LogicLayer',
		'goo/logic/LogicNode',
		'goo/logic/LogicNodes',
		'goo/logic/LogicInterface'
	],
	/** @lends */
	function(LogicLayer, LogicNode, LogicNodes, LogicInterface) {
		"use strict";

		/**
		 * @class Logic node that calculates sine
		 */
		function LogicNodeSine() {
			LogicNode.call(this);
			this.logicInterface = LogicNodeSine.logicInterface;
			this.type = "LogicNodeSine";
			this._time = 0;
		}

		LogicNodeSine.prototype = Object.create(LogicNode.prototype);
		LogicNodeSine.editorName = "Sine";

		LogicNodeSine.prototype.onPropertyWrite = function(portID, value) {
			LogicLayer.writeValue(this.logicInstance, LogicNodeSine.outportSin, Math.sin(value));
			LogicLayer.writeValue(this.logicInstance, LogicNodeSine.outportCos, Math.cos(value));
		};

		LogicNodeSine.logicInterface = new LogicInterface();
		LogicNodeSine.outportSin = LogicNodeSine.logicInterface.addOutputProperty("Sine", "float");
		LogicNodeSine.outportCos = LogicNodeSine.logicInterface.addOutputProperty("Cosine", "float");
		LogicNodeSine.inportPhase = LogicNodeSine.logicInterface.addInputProperty("Phase", "float", 0);

		LogicNodes.registerType("LogicNodeSine", LogicNodeSine);

		return LogicNodeSine;
	});