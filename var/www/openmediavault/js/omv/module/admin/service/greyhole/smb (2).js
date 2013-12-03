/**
 * vim: tabstop=4
 *
 * @license http://www.gnu.org/licenses/gpl.html GPL Version 3
 * @author Stephane Bocquet <stephane_bocquet@hotmail.com>
 * @author Marcel Beck <marcel.beck@mbeck.org>
 * @copyright Copyright (c) 2011 Stephane Bocquet
 * @copyright Copyright (c) 2011 Marcel Beck
 * @version $Id: greyhole.js 12 2011-11-07 18:52:10Z
 *          stephane_bocquet@hotmail.com $
 *
 * This file is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or any later version.
 *
 * This file is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this file. If not, see <http://www.gnu.org/licenses/>.
 */
// require("js/omv/NavigationPanel.js")
// require("js/omv/data/DataProxy.js")
// require("js/omv/FormPanelExt.js")
// require("js/omv/form/SharedFolderComboBox.js")
// require("js/omv/form/plugins/FieldInfo.js")

// require("js/omv/module/greyhole/panel/navigation.js")

// require("js/omv/module/greyhole/admin/dialog/smb.js")

Ext.ns("OMV.Module.Storage.Greyhole.Admin");

/**
 * @class OMV.Module.Storage.Greyhole.Admin.SMBPanel
 * @derived OMV.grid.TBarGridPanel
 * Display list of configured filesystems.
 */
OMV.Module.Storage.Greyhole.Admin.SMBPanel = function (config) {
	var initialConfig = {
		hidePagingToolbar:false,
		autoReload       :true,
		stateId          :"85f1cbf2-23d3-4960-a803-b7fc34d42235",
		colModel         :new Ext.grid.ColumnModel({
			columns:[
				{
					header   :_("SMB Share"),
					sortable :true,
					dataIndex:"name",
					id       :"name"
				},
				{
					header   :_("Comment"),
					sortable :true,
					dataIndex:"comment",
					id       :"comment"
				},
				{
					header   :_("Files copies"),
					sortable :true,
					dataIndex:"num_copies",
					id       :"num_copies",
					width    :20
				},
				{
					header   :_("Sticky files"),
					sortable :true,
					dataIndex:"sticky_files",
					id       :"sticky_files",
					renderer :OMV.util.Format.booleanRenderer(),
					width    :20
				},
				{
					header   :_("Use Trash"),
					sortable :true,
					dataIndex:"trash",
					id       :"trash",
					renderer :OMV.util.Format.booleanRenderer(),
					width    :20
				}
			]
		})
	};
	Ext.apply(initialConfig, config);
	OMV.Module.Storage.Greyhole.Admin.SMBPanel.superclass.constructor.call(this, initialConfig);
};
Ext.extend(OMV.Module.Storage.Greyhole.Admin.SMBPanel, OMV.grid.TBarGridPanel, {
	initComponent:function () {
		this.store = new OMV.data.Store({
			autoLoad  :true,
			remoteSort:false,
			proxy     :new OMV.data.DataProxy({
				"service":"Greyhole",
				"method" :"getSMBList"
			}),
			reader    :new Ext.data.JsonReader({
				idProperty   :"uuid",
				totalProperty:"total",
				root         :"data",
				fields       :[
					{ name:"uuid" },
					{ name:"name" },
					{ name:"comment" },
					{ name:"num_copies" },
					{ name:"sticky_files" },
					{ name:"trash" }
				]
			})
		});
		OMV.Module.Storage.Greyhole.Admin.SMBPanel.superclass.initComponent.apply(this, arguments);
		// Register event handler
		// Reselect previous selected rows after the store has been
		// reloaded, e.g. to make sure toolbar is updated depending on
		// the latest row record values.
		this.getSelectionModel().previousSelections = [];
		this.store.on("beforeload", function (store, options) {
			var sm = this.getSelectionModel();
			var records = sm.getSelections();
			sm.previousSelections = [];
			Ext.each(records, function (record, index) {
				sm.previousSelections.push(record.get("uuid"));
			}, this);
		}, this);
		this.store.on("load", function (store, records, options) {
			var sm = this.getSelectionModel();
			var rows = [];
			if (Ext.isDefined(sm.previousSelections)) {
				for (var i = 0; i < sm.previousSelections.length; i++) {
					var index = store.findExact("uuid",
									sm.previousSelections[i]);
					if (index !== -1) {
						rows.push(index);
					}
				}
			}
			if (rows.length > 0) {
				sm.selectRows(rows);
			}
		}, this);
	},

	initToolbar:function () {
		var tbar = OMV.Module.Storage.Greyhole.Admin.SMBPanel.superclass.initToolbar.apply(this);

		tbar.remove(2);

		tbar.insert(2, {
			id      :this.getId() + "-remove",
			xtype   :"button",
			text    :_("Remove"),
			icon    :"images/delete.png",
			handler :this.cbRemoveShareBtnHdl,
			scope   :this,
			disabled:true
		});

		tbar.insert(3, {
			id     :this.getId() + "-fsck",
			xtype  :"button",
			text   :_("Files check"),
			icon   :"images/greyhole-fsck.png",
			handler:this.cbfsckBtnHdl,
			scope  :this
		});

		tbar.insert(4, {
			id     :this.getId() + "-unfsck",
			xtype  :"button",
			text   :_("Cancel all checks"),
			icon   :"images/greyhole-unfsck.png",
			handler:this.cbunfsckBtnHdl,
			scope  :this
		});

		return tbar;
	},

	cbSelectionChangeHdl:function (model) {
		OMV.Module.Storage.Greyhole.Admin.SMBPanel.superclass.cbSelectionChangeHdl.apply(this, arguments);
		// Process additional buttons
		this.toggleButtons();
	},

	toggleButtons:function () {
		var sm = this.getSelectionModel();
		var records = sm.getSelections();

		var tbarRemoveCtrl = this.getTopToolbar().findById(this.getId() + "-remove");

		if (records.length <= 0) {
			tbarRemoveCtrl.disable();
		} else {
			tbarRemoveCtrl.enable();
		}
	},

	cbAddBtnHdl:function () {
		var wnd = new OMV.Module.Storage.Greyhole.Admin.SMBDialog({
			uuid     :OMV.UUID_UNDEFINED,
			listeners:{
				submit:function () {
					this.doReload();
				},
				scope :this
			}
		});
		wnd.show();
	},

	cbEditBtnHdl:function () {
		var selModel = this.getSelectionModel();
		var record = selModel.getSelected();
		var wnd = new OMV.Module.Storage.Greyhole.Admin.SMBDialog({
			uuid     :record.get("uuid"),
			listeners:{
				submit:function () {
					this.doReload();
				},
				scope :this
			}
		});
		wnd.show();
	},

	cbRemoveShareBtnHdl:function () {
		var selModel = this.getSelectionModel();
		var record = selModel.getSelected();
		OMV.MessageBox.show({
			title  :_("Confirmation"),
			msg    :_("Do you want to remove the selected share from Greyhole?"),
			buttons:Ext.Msg.YESNO,
			fn     :function (answer) {
				if (answer == "no")
					return;
				var wnd = new OMV.ExecCmdDialog({
					title               :_("Removing share ..."),
					rpcService          :"Greyhole",
					rpcMethod           :"removeSMBShare",
					rpcArgs             :{ "uuid":record.get('uuid') },
					hideStart           :true,
					hideStop            :true,
					killCmdBeforeDestroy:false,
					listeners           :{
						finish   :function (wnd, response) {
							wnd.appendValue("\n" + _("Done ..."));
							wnd.setButtonDisabled("close", false);
						},
						exception:function (wnd, error) {
							OMV.MessageBox.error(null, error);
							wnd.setButtonDisabled("close", false);
						},
						close    :function () {
							this.doReload();
						},
						scope    :this
					}
				});
				wnd.setButtonDisabled("close", true);
				wnd.show();
				wnd.start();
			},
			scope  :this,
			icon   :Ext.Msg.QUESTION
		});
	},

	/** FSCK HANDLER */
	cbfsckBtnHdl:function () {
		var wnd = new OMV.Module.Storage.Greyhole.Admin.FSCKDialog({
			listeners:{
				success:function (wnd, path, email_report, dont_walk_metadata_store, find_orphaned_files, checksums, delete_rphaned_metadata) {
					this.dofsck(path, email_report, dont_walk_metadata_store, find_orphaned_files, checksums, delete_rphaned_metadata);
				},
				scope  :this
			},
			type     :"smb"
		});
		wnd.show();
	},
	dofsck      :function (path, email_report, dont_walk_metadata_store, find_orphaned_files, checksums, delete_rphaned_metadata) {
		OMV.Ajax.request(this.cbfsckLHdl, this, "Greyhole", "fsck",
						{
							path                    :String(path),
							email_report            :Boolean(email_report),
							checksums               :Boolean(checksums),
							dont_walk_metadata_store:Boolean(dont_walk_metadata_store),
							find_orphaned_files     :Boolean(find_orphaned_files),
							delete_orphaned_metadata:Boolean(delete_rphaned_metadata)
						}
		);
	},
	cbfsckLHdl  :function (id, response, error) {
		if (error !== null) {
			// Display error message
			OMV.MessageBox.error(null, error);
		} else {
			OMV.MessageBox.hide();
			this.doReload();
		}
	},
	/** /FSCK HANDLER */

	/** CANCEL FSCK HANDLER */
	cbunfsckBtnHdl:function () {
		this.dounfsck();
	},
	dounfsck      :function () {
		OMV.Ajax.request(this.cbunfsckLHdl, this, "Greyhole", "unfsck", []);
	},
	cbunfsckLHdl  :function (id, response, error) {
		if (error !== null) {
			// Display error message
			OMV.MessageBox.error(null, error);
		} else {
			OMV.MessageBox.hide();
			this.doReload();
		}
	}
	/** /CANCEL FSCK HANDLER */
});

OMV.NavigationPanelMgr.registerPanel("storage", "greyhole", {
	cls     :OMV.Module.Storage.Greyhole.Admin.SMBPanel,
	position:30,
	title   :_("SMB Shares")
});
