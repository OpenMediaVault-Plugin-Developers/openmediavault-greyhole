/**
 * Created by JetBrains PhpStorm.
 * User: sbocquet
 * Date: 14.02.12
 * Time: 16:00
 * To change this template use File | Settings | File Templates.
 */

// require("js/omv/data/DataProxy.js")
// require("js/omv/data/Store.js")
// require("js/omv/grid/GridPanel.js")
// require("js/omv/form/plugins/FieldInfo.js")
// require("js/omv/util/Format.js")
// require("js/omv/Window.js")

Ext.ns("OMV.Module.Storage.Greyhole.Admin");

/**
 * @class OMV.Module.Storage.Greyhole.Admin.PoolMngtDialog
 */
OMV.Module.Storage.Greyhole.Admin.PoolMngtDialog = function (config) {
	var initialConfig = {
		title      :_('Disk Pool Management'),
		waitMsg    :_("Starting disk pool management ..."),
		width      :550,
		autoHeight :true,
		layout     :"fit",
		modal      :true,
		border     :false,
		buttonAlign:"center",
		buttons    :[
			{
				text   :_("OK"),
				handler:this.cbOkBtnHdl.createDelegate(this),
				scope  :this
			},
			{
				text   :_("Cancel"),
				handler:this.cbCancelBtnHdl.createDelegate(this),
				scope  :this
			}
		]
	};
	Ext.apply(initialConfig, config);
	OMV.Module.Storage.Greyhole.Admin.PoolMngtDialog.superclass.constructor.call(this, initialConfig);
	this.addEvents(
					/**
					 * Fires after the installation has been finished successful.
					 */
					"success",
					"before"
	);
};
Ext.extend(OMV.Module.Storage.Greyhole.Admin.PoolMngtDialog, OMV.Window, {
	initComponent:function () {
		this.form = new Ext.form.FormPanel({
			frame     :true,
			border    :false,
			layout    :"form",
			defaults  :{
				anchor        :"100%",
				labelSeparator:""
			},
			autoHeight:true,
			fileUpload:true,
			items     :[
				{
					xtype        :"combo",
					name         :"path",
					id           :"path",
					hiddenName   :"path",
					fieldLabel   :_("Pool disk"),
					emptyText    :_("Select a Pool Disk..."),
					allowBlank   :false,
					allowNone    :false,
					editable     :false,
					triggerAction:"all",
					displayField :"show",
					valueField   :"path",
					store        :new OMV.data.Store({
						remoteSort:false,
						proxy     :new OMV.data.DataProxy({"service":"Greyhole", "method":"getPoolMngtCandidates"}),
						reader    :new Ext.data.JsonReader({
							idProperty:"path",
							fields    :[
								{ name:"show" },
								{ name:"path" }
							]
						})
					})
				},
				{
					xtype     :'radiogroup',
					fieldLabel:_('Pool Managment'),
					columns   :1,
					vertical  :true,
					id        :"diskmngt",
					items     :[
						{
							xtype     :"radio",
							name      :"diskmngt",
							id        :"wait_for",
							hideLabel :true,
							boxLabel  :_("Wait for"),
							checked   :true,
							inputValue:"wait_for",
							plugins   :[ OMV.form.plugins.FieldInfo ],
							infoText  :_("Tell Greyhole that the missing drive will return soon, and that it shouldn't re-create additional file copies to replace it.")
						},
						{
							xtype     :"radio",
							name      :"diskmngt",
							id        :"going",
							hideLabel :true,
							boxLabel  :_("Going"),
							inputValue:"going",
							plugins   :[ OMV.form.plugins.FieldInfo ],
							infoText  :_("Tell Greyhole that you want to remove a drive. Greyhole will then make sure you don't loose any files, and that the correct number of file copies are created to replace the missing drive.")
						},
						{
							xtype     :"radio",
							name      :"diskmngt",
							id        :"gone",
							hideLabel :true,
							boxLabel  :_("Gone"),
							inputValue:"gone",
							plugins   :[ OMV.form.plugins.FieldInfo ],
							infoText  :_("Tell Greyhole that the missing drive at is gone for good. Greyhole will start replacing the missing file copies instantly.")
						},
						{
							xtype     :"radio",
							name      :"diskmngt",
							id        :"replaced",
							hideLabel :true,
							boxLabel  :_("Replaced"),
							inputValue:"replaced",
							plugins   :[ OMV.form.plugins.FieldInfo ],
							infoText  :_("Tell Greyhole that you replaced the drive.")
						}
					]}

			]
		});
		this.items = this.form;
		OMV.Module.Storage.Greyhole.Admin.PoolMngtDialog.superclass.initComponent.apply(this, arguments);
	},

	/**
	 * @method cbOkBtnHdl
	 * Method that is called when the 'OK' button is pressed.
	 */
	cbOkBtnHdl:function () {
		var basicForm = this.form.getForm();
		if (!basicForm.isValid()) {
			return;
		}
		var path = Ext.getCmp('path').getValue();
		var diskmngt = Ext.getCmp('diskmngt').getValue().getId();

		this.fireEvent("success", this, path, diskmngt);
		this.close();
	},

	/**
	 * @method cbCancelBtnHdl
	 * Method that is called when the 'Cancel' button is pressed.
	 */
	cbCancelBtnHdl:function () {
		this.close();
	}
});