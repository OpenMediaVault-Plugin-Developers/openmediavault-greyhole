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
// require("js/omv/Window.js")

Ext.ns("OMV.Module.Storage.Greyhole.Admin");

/**
 * @class OMV.Module.Storage.Greyhole.Admin.FSCKDialog
 */
OMV.Module.Storage.Greyhole.Admin.FSCKDialog = function (config) {
	var initialConfig = {
		title      :'Files check',
		waitMsg    :"Starting fsck ...",
		width      :550,
		autoHeight :true,
		layout     :"fit",
		modal      :true,
		border     :false,
		buttonAlign:"center",
		buttons    :[
			{
				text   :"OK",
				handler:this.cbOkBtnHdl.createDelegate(this),
				scope  :this
			},
			{
				text   :"Cancel",
				handler:this.cbCancelBtnHdl.createDelegate(this),
				scope  :this
			}
		],
		type       :"all"
	};
	Ext.apply(initialConfig, config);
	OMV.Module.Storage.Greyhole.Admin.FSCKDialog.superclass.constructor.call(this, initialConfig);
	this.addEvents(
					/**
					 * Fires after the installation has been finished successful.
					 */
					"success",
					"before"
	);
};
Ext.extend(OMV.Module.Storage.Greyhole.Admin.FSCKDialog, OMV.Window, {
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
					fieldLabel   :_("Path"),
					emptyText    :_("Select a Path ..."),
					allowBlank   :false,
					allowNone    :false,
					editable     :false,
					triggerAction:"all",
					displayField :"show",
					valueField   :"path",
					store        :new OMV.data.Store({
						remoteSort:false,
						proxy     :new OMV.data.DataProxy({"service":"Greyhole", "method":"getFsckCandidates", "extraParams":{ "type":this.type }}),
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
					xtype     :"checkbox",
					name      :"email_report",
					id        :"email_report",
					fieldLabel:_("Email report"),
					checked   :false,
					inputValue:1,
					plugins   :[ OMV.form.plugins.FieldInfo ],
					infoText  :_("Send an email when fsck completes, to report on what was checked, and any error that was found.")
				},
				{
					xtype     :"checkbox",
					name      :"checksums",
					id        :"checksums",
					fieldLabel:_("Checksums"),
					checked   :false,
					inputValue:1,
					plugins   :[ OMV.form.plugins.FieldInfo ],
					infoText  :_("Read ALL files in your storage pool, and check that file copies are identical. This will identify any problem you might have with your file-systems. NOTE: this can take a LONG time to complete, since it will read everything from all your drives!")
				},
				{
					xtype     :"checkbox",
					name      :"dont_walk_metadata_store",
					id        :"dont_walk_metadata_store",
					fieldLabel:_("Don't walk metadata store"),
					checked   :false,
					inputValue:1,
					plugins   :[ OMV.form.plugins.FieldInfo ],
					infoText  :_("Speed up fsck by skipping the scan of the metadata store directories. Scanning the metadata stores is only required to re-create symbolic links that might be missing from your shared directories.")
				},
				{
					xtype     :"checkbox",
					name      :"find_orphaned_files",
					id        :"find_orphaned_files",
					fieldLabel:_("Find orphaned files"),
					checked   :false,
					inputValue:1,
					plugins   :[ OMV.form.plugins.FieldInfo ],
					infoText  :_("Scan for files with no metadata in the storage pool drives. This will allow you to include existing files on a drive in your storage pool without having to copy them manually.")
				},
				{
					xtype     :"checkbox",
					name      :"delete_orphaned_metadata",
					id        :"delete_orphaned_metadata",
					fieldLabel:_("Delete orphaned metadata"),
					checked   :false,
					inputValue:1,
					plugins   :[ OMV.form.plugins.FieldInfo ],
					infoText  :_("When fsck find metadata files with no file copies, delete those metadata files. If the file copies re-appear later, you'll need to run fsck with --find-orphaned-files to have them reappear in your shares.")
				}
			]
		});
		this.items = this.form;
		OMV.Module.Storage.Greyhole.Admin.FSCKDialog.superclass.initComponent.apply(this, arguments);
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
		var email_report = Ext.getCmp('email_report').getValue();
		var dont_walk_metadata_store = Ext.getCmp('dont_walk_metadata_store').getValue();
		var find_orphaned_files = Ext.getCmp('find_orphaned_files').getValue();
		var checksums = Ext.getCmp('checksums').getValue();
		var delete_orphaned_metadata = Ext.getCmp('delete_orphaned_metadata').getValue();

		this.fireEvent("success", this, path, email_report, dont_walk_metadata_store, find_orphaned_files, checksums, delete_orphaned_metadata);
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