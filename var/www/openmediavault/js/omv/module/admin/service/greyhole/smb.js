/**
 * Created by JetBrains PhpStorm.
 * User: mbeck
 * Date: 11.12.11
 * Time: 22:36
 * To change this template use File | Settings | File Templates.
 */

	// require("js/omv/data/DataProxy.js")
	// require("js/omv/data/Store.js")
	// require("js/omv/grid/GridPanel.js")
	// require("js/omv/form/plugins/FieldInfo.js")
	// require("js/omv/util/Format.js")

Ext.ns("OMV.Module.Storage.Greyhole.Admin");

/**
 * @class OMV.Module.Storage.Greyhole.Admin.SMBDialog
 * @derived OMV.CfgObjectDialog
 */
OMV.Module.Storage.Greyhole.Admin.SMBDialog = function (config) {
	var initialConfig = {
		rpcService  :"Greyhole",
		rpcGetMethod:"getSBMShare",
		rpcSetMethod:"setSMBShare",
		title       :((config.uuid == OMV.UUID_UNDEFINED) ? "Add" : "Edit") + " SMB share",
		width       :550,
		autoHeight  :true
	};
	Ext.apply(initialConfig, config);
	OMV.Module.Storage.Greyhole.Admin.SMBDialog.superclass.constructor.call(this, initialConfig);
};
Ext.extend(OMV.Module.Storage.Greyhole.Admin.SMBDialog, OMV.CfgObjectDialog, {
	initComponent:function () {
		OMV.Module.Storage.Greyhole.Admin.SMBDialog.superclass.initComponent.apply(this, arguments);
		// Register event handler
		this.on("load", this._updateFormFields, this);
	},

	getFormConfig:function () {
		return {
			autoHeight:true
		};
	},

	getFormItems:function () {
		return [
			{
				xtype        :"combo",
				name         :"smbref",
				hiddenName   :"smbref",
				fieldLabel   :_("SMB Share"),
				emptyText    :_("Select an SMB Share ..."),
				allowBlank   :false,
				allowNone    :false,
				editable     :false,
				triggerAction:"all",
				displayField :"name",
				valueField   :"uuid",
				store        :new OMV.data.Store({
					remoteSort:false,
					proxy     :new OMV.data.DataProxy({"service":"Greyhole", "method":"getSMBShareCandidates"}),
					reader    :new Ext.data.JsonReader({
						idProperty:"uuid",
						fields    :[
							{ name:"uuid" },
							{ name:"name" }
						]
					})
				})
			},
			{
				xtype        :"combo",
				name         :"num_copies",
				hiddenName   :"num_copies",
				fieldLabel   :_("Number of Copies"),
				emptyText    :_("Select Number of Copies ..."),
				allowBlank   :false,
				allowNone    :false,
				editable     :false,
				triggerAction:"all",
				displayField :"name",
				valueField   :"number",
				store        :new OMV.data.Store({
					remoteSort:false,
					proxy     :new OMV.data.DataProxy({"service":"Greyhole", "method":"getPoolDiskCount"}),
					reader    :new Ext.data.JsonReader({
						idProperty:"number",
						fields    :[
							{ name:"number" },
							{ name:"name" }
						]
					})
				}),
				plugins      :[ OMV.form.plugins.FieldInfo ],
				infoText     :_("This is the number of copies of each file you want Greyhole to keep per Share. This is not the number of duplicates! 2 copies = 1 duplicate.")
			},
			{
				xtype     :"checkbox",
				name      :"sticky_files",
				fieldLabel:_("Sticky files"),
				checked   :false,
				inputValue:1,
				plugins   :[ OMV.form.plugins.FieldInfo ],
				infoText  :_("Sticky files are files that will always 'live' together in the storage pool. This will allow you to read (and read-only!) those files by using the storage pool drives themselves, instead of using the mounted shares.")
			},
			{
				xtype     :"checkbox",
				name      :"trash",
				fieldLabel:_("Use Trash"),
				checked   :false,
				inputValue:1,
				plugins   :[ OMV.form.plugins.FieldInfo ],
				infoText  :_("You can specify per-share trash preferences that will override the global trash preference.")
			}
		];
	},

	/**
	 * Private function to update the states of various form fields.
	 */
	_updateFormFields:function () {
		if (this.uuid == OMV.UUID_UNDEFINED) {
			return;
		}
		var fields = [ "name", "smbref" ];
		for (var i = 0; i < fields.length; i++) {
			var field = this.findFormField(fields[i]);
			if (!Ext.isEmpty(field)) {
				field.setReadOnly(true);
			}
		}
	}
});